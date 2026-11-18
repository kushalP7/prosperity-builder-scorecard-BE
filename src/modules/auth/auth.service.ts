import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Op } from 'sequelize';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { User, UserRole } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Inquiry } from '../inquiries/entities/inquiry.entity';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { EmailService } from '../../integrations/email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { getErrorMessage, getErrorStack } from '../../common/errors';
import { getFrontendBaseUrl } from '../../common/frontend-url';
import { getPasswordResetFrom, getAdminInquiryEmail } from '../../common/mail-config';
import {
  buildPasswordResetTemplate,
  buildPortalInviteTemplate,
} from '../../common/email-templates';

/** Admin-sent set-password / reset links (same TTL as portal invites). */
const SET_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Order)
    private readonly orderModel: typeof Order,
    @InjectModel(Inquiry)
    private readonly inquiryModel: typeof Inquiry,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user as `customer` with subscriptionStatus `none`.
   * Payment activates entitlement — role does not change.
   */
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(`An account with email '${email}' already exists.`);
    }

    const hashedPassword = await this.passwordService.hash(dto.password);
    const defaultRole: UserRole = 'customer';

    const avatarBgMap: Record<string, string> = {
      super_admin: 'bg-[#7c0d15] text-white',
      project_lead: 'bg-blue-600 text-white',
      assessment_specialist: 'bg-emerald-600 text-white',
      customer: 'bg-slate-700 text-white',
    };

    // Claim prior paid order entitlement (pay-before-register flow)
    const paidOrder = await this.orderModel.findOne({
      where: { customerEmail: email, status: 'paid' },
      order: [['paidAt', 'DESC']],
    });

    const subscribedAt = paidOrder ? paidOrder.paidAt || new Date() : null;
    let subscriptionExpiresAt: Date | null = null;
    if (subscribedAt) {
      subscriptionExpiresAt = new Date(subscribedAt);
      subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);
    }

    const user = await this.userModel.create({
      name: dto.name.trim(),
      email,
      password: hashedPassword,
      role: defaultRole,
      subscriptionStatus: paidOrder ? 'active' : 'none',
      subscriptionPackage: paidOrder?.packageType || null,
      subscribedAt,
      subscriptionExpiresAt,
      department: dto.department || 'Planning Board',
      status: 'active',
      avatarBg: avatarBgMap[defaultRole],
      avatarUrl: null,
      lastActive: new Date(),
    });

    if (paidOrder && !paidOrder.customerUserId) {
      await paidOrder.update({ customerUserId: user.id }).catch(() => undefined);
    }

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    });

    const refreshToken = await this.tokenService.generateRefreshToken(user.id);
    const refreshTokenHash = await this.passwordService.hash(refreshToken);
    await user.update({ refreshTokenHash, lastActive: new Date() });

    const safeUser = this.sanitizeUser(user);

    return {
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
      message: 'Registration successful! Welcome to Rose Associates.',
    };
  }

  /**
   * Authenticates user, verifies Argon2 password hash, and issues short-lived encrypted JWT.
   */
  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValidPassword = await this.passwordService.verify(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException('Your account has been suspended. Please contact your system administrator.');
    }

    if (user.status === 'pending') {
      throw new UnauthorizedException(
        'Please use the invite link from your email to set your password before signing in.',
      );
    }

    await this.ensureSubscriptionFresh(user);

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    });

    const refreshToken = await this.tokenService.generateRefreshToken(user.id);
    const refreshTokenHash = await this.passwordService.hash(refreshToken);
    await user.update({ refreshTokenHash, lastActive: new Date() });

    const safeUser = this.sanitizeUser(user);

    return {
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
      message: 'Signed in successfully.',
    };
  }

  /**
   * Refreshes an expired short-lived access token using a valid encrypted refresh token.
   */
  async refresh(refreshToken: string) {
    try {
      const payload = await this.tokenService.verifyToken(refreshToken);

      if (payload.tokenType !== 'refresh' || !payload.sub) {
        throw new UnauthorizedException('Invalid token type for session renewal.');
      }

      const user = await this.userModel.findByPk(payload.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('Session user is inactive or no longer exists.');
      }

      if (!user.refreshTokenHash) {
        throw new UnauthorizedException('Session has been revoked. Please sign in again.');
      }

      const isTokenValid = await this.passwordService.verify(refreshToken, user.refreshTokenHash);
      if (!isTokenValid) {
        throw new UnauthorizedException('Refresh token is invalid or expired.');
      }

      await this.ensureSubscriptionFresh(user);

      const newAccessToken = await this.tokenService.generateAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
      });

      // Renew refresh token as well for rolling refresh
      const newRefreshToken = await this.tokenService.generateRefreshToken(user.id);
      const newRefreshTokenHash = await this.passwordService.hash(newRefreshToken);
      await user.update({ refreshTokenHash: newRefreshTokenHash, lastActive: new Date() });

      return {
        success: true,
        data: {
          user: this.sanitizeUser(user),
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (err: unknown) {
      this.logger.warn(`Token refresh error: ${getErrorMessage(err)}`);
      throw new UnauthorizedException('Unable to refresh session. Please sign in again.');
    }
  }

  /**
   * Revokes user's active session and refresh token.
   */
  async logout(userId: string) {
    await this.userModel.update({ refreshTokenHash: null }, { where: { id: userId } });
    return {
      success: true,
      message: 'Session terminated and signed out successfully.',
    };
  }

  /**
   * Retrieves profile details for the currently authenticated user.
   */
  async getMe(userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User profile not found.');
    }
    await this.ensureSubscriptionFresh(user);
    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  /**
   * Super-admin action: email a set-password link (pending invite or active reset).
   * From info@ (MAIL_FROM / PASSWORD_RESET_FROM). Link expires in 7 days.
   */
  async adminSendSetPasswordEmail(userId: string) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.status === 'suspended') {
      throw new BadRequestException('Cannot send a set-password email to a suspended account. Activate the user first.');
    }
    if (user.status !== 'pending' && user.status !== 'active') {
      throw new BadRequestException('Set-password email is only available for pending or active accounts.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + SET_PASSWORD_TTL_MS);
    await user.update({
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
    });

    const frontendUrl = getFrontendBaseUrl(this.configService);
    const isReset = user.status === 'active';
    const setPasswordUrl = `${frontendUrl}/set-password?token=${encodeURIComponent(rawToken)}${isReset ? '&mode=reset' : ''}`;
    const configuredLogoUrl = this.configService.get<string>('APP_LOGO_URL');
    const localLogoPath = path.resolve(process.cwd(), 'assets', 'logo.png');
    const hasLocalLogo = fs.existsSync(localLogoPath);
    const logoUrl = configuredLogoUrl || (hasLocalLogo ? 'cid:roselogo' : '/logo.png');
    const attachments =
      !configuredLogoUrl && hasLocalLogo
        ? [{ filename: 'logo.png', path: localLogoPath, cid: 'roselogo' }]
        : [];
    const firstName = (user.name || 'there').split(/\s+/)[0] || 'there';
    const from = getPasswordResetFrom(this.configService);
    const replyTo = getAdminInquiryEmail(this.configService);

    try {
      if (isReset) {
        await this.emailService.sendEmail({
          from,
          to: user.email,
          replyTo,
          subject: 'Reset your Rose Associates portal password',
          html: buildPasswordResetTemplate({ firstName, resetUrl: setPasswordUrl }, logoUrl),
          attachments,
        });
      } else {
        await this.emailService.sendEmail({
          from,
          to: user.email,
          replyTo,
          subject: 'Your Rose Associates portal access — set your password',
          html: buildPortalInviteTemplate({ firstName, setPasswordUrl }, logoUrl),
          attachments,
        });
      }
    } catch (err: unknown) {
      this.logger.error(
        `Admin set-password email failed for ${user.email}: ${getErrorMessage(err)}`,
        getErrorStack(err),
      );
      throw new BadRequestException(
        'Could not send the set-password email. Check SMTP configuration and try again.',
      );
    }

    return {
      success: true,
      message: isReset
        ? `Password reset link sent to ${user.email}.`
        : `Set-password invite sent to ${user.email}.`,
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Complete portal invite OR admin set-password link: validate token, set password, issue session.
   * Works for pending (invite) and active (admin reset) users.
   */
  async setPasswordFromInvite(dto: SetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token.trim()).digest('hex');
    const user = await this.userModel.findOne({
      where: {
        inviteTokenHash: tokenHash,
        inviteTokenExpiresAt: { [Op.gt]: new Date() },
        status: { [Op.in]: ['pending', 'active'] },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'This password link is invalid or has expired. Ask your administrator to send a new set-password email.',
      );
    }

    const wasPending = user.status === 'pending';
    const hashedPassword = await this.passwordService.hash(dto.password);
    await user.update({
      password: hashedPassword,
      status: 'active',
      inviteTokenHash: null,
      inviteTokenExpiresAt: null,
      refreshTokenHash: null, // revoke prior sessions after password change
      lastActive: new Date(),
    });

    if (wasPending) {
      await this.inquiryModel.update({ status: 'registered' }, { where: { userId: user.id } });
    }

    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    });
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);
    const refreshTokenHash = await this.passwordService.hash(refreshToken);
    await user.update({ refreshTokenHash });

    return {
      success: true,
      data: {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      },
      message: wasPending
        ? 'Password set successfully. Welcome to the portal.'
        : 'Password updated successfully. You are signed in.',
    };
  }

  /**
   * Self-service profile update (name / avatar). Does not change role or subscription.
   */
  async updateMe(userId: string, dto: { name?: string; avatarUrl?: string | null }) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User profile not found.');
    }

    if (dto.name !== undefined) {
      const trimmed = String(dto.name || '').trim();
      if (trimmed) user.name = trimmed;
    }

    if (dto.avatarUrl !== undefined) {
      const url = dto.avatarUrl == null ? '' : String(dto.avatarUrl).trim();
      user.avatarUrl = url || null;
    }

    await user.save();

    return {
      success: true,
      data: this.sanitizeUser(user),
      message: 'Profile updated successfully',
    };
  }

  /** Flip active → expired when subscriptionExpiresAt has passed. */
  private async ensureSubscriptionFresh(user: User) {
    if ( user.subscriptionStatus === 'active' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < Date.now() ) {
      await user.update({ subscriptionStatus: 'expired' });
    }
  }

  private sanitizeUser(user: User) {
    const json = user.toJSON();
    delete json.password;
    delete json.refreshTokenHash;
    delete json.inviteTokenHash;
    return json;
  }
}
