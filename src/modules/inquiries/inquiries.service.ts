import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Op } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Inquiry } from './entities/inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../../integrations/email/email.service';
import { PricingBrochureService } from './pricing-brochure.service';
import { PasswordService } from '../auth/services/password.service';
import { getErrorMessage, getErrorStack } from '../../common/errors';
import {
  buildAdminInquiryNotificationTemplate,
  buildCustomerAcknowledgementTemplate,
  buildCustomerCountyCityAcknowledgementTemplate,
  buildPortalInviteTemplate,
  buildAlreadyRegisteredLoginTemplate,
  InquiryEmailData,
} from '../../common/email-templates';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GOV_ROLES = new Set(['county', 'city']);

@Injectable()
export class InquiriesService {
  private readonly logger = new Logger(InquiriesService.name);

  constructor(
    @InjectModel(Inquiry)
    private readonly inquiryModel: typeof Inquiry,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly pricingBrochureService: PricingBrochureService,
    private readonly passwordService: PasswordService,
  ) { }

  async createInquiry(dto: CreateInquiryDto): Promise<{ success: boolean; message: string; id: string }> {
    const inquiry = await this.inquiryModel.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      organizationName: dto.organizationName.trim(),
      jobTitle: dto.jobTitle.trim(),
      businessEmail: dto.businessEmail.trim().toLowerCase(),
      phoneNumber: dto.phoneNumber.trim(),
      city: dto.city.trim(),
      state: dto.state.trim(),
      country: dto.country?.trim() || 'United States',
      organizationType: dto.organizationType.trim(),
      leadRole: dto.leadRole,
      notes: dto.notes?.trim() || null,
      status: 'pending',
      userId: null,
      invitedAt: null,
    });

    this.logger.log(`New inquiry saved ID=${inquiry.id} (${dto.organizationName}, leadRole=${dto.leadRole})`);
    this.dispatchEmails(dto, inquiry.id).catch((err: unknown) => {
      this.logger.error(`dispatchEmails failed for ${inquiry.id}: ${getErrorMessage(err)}`, getErrorStack(err));
    });

    return {
      success: true,
      message: 'Inquiry submitted successfully. We have received your request and will contact you shortly.',
      id: inquiry.id,
    };
  }

  async findAll(options?: { search?: string; leadRole?: string; status?: string; page?: number; limit?: number; sortBy?: string; sortDir?: string; }) {
    const search = options?.search?.trim();
    const leadRole = options?.leadRole;
    const status = options?.status;
    const pageNum = Math.max(1, Number(options?.page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(options?.limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { organizationName: { [Op.iLike]: `%${search}%` } },
        { businessEmail: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (leadRole && leadRole !== 'all') {
      where.leadRole = leadRole;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const allowedSort = new Set(['createdAt', 'firstName', 'lastName', 'organizationName', 'businessEmail', 'leadRole', 'status',]);
    const sortBy = allowedSort.has(options?.sortBy || '') ? options!.sortBy! : 'createdAt';
    const sortDir = (options?.sortDir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { rows, count } = await this.inquiryModel.findAndCountAll({
      where,
      order: [[sortBy, sortDir]],
      limit: limitNum,
      offset,
    });

    return {
      data: rows.map((r) => r.toJSON()),
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum) || 1,
    };
  }

  async sendPortalAccess(inquiryId: string) {
    const inquiry = await this.inquiryModel.findByPk(inquiryId);
    if (!inquiry) throw new NotFoundException('Inquiry not found');

    if (!GOV_ROLES.has(inquiry.leadRole)) {
      throw new ForbiddenException('Portal access can only be sent to Authorized County or City/Town representatives.');
    }

    const email = inquiry.businessEmail.trim().toLowerCase();
    const existing = await this.userModel.findOne({ where: { email } });
    const { logoUrl, attachments, customerFrom, adminEmail } = this.mailExtras();
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').replace(/\/+$/, '');

    const jurisdictionType = inquiry.leadRole === 'city' ? 'CITY' : inquiry.leadRole === 'county' ? 'COUNTY' : null;

    if (existing) {
      await existing.update({ leadRole: inquiry.leadRole, jurisdictionType: jurisdictionType || existing.jurisdictionType });

      if (existing.status === 'pending' && existing.inviteTokenHash) {
        const { rawToken, tokenHash, expiresAt } = await this.createInviteToken();
        await existing.update({ inviteTokenHash: tokenHash, inviteTokenExpiresAt: expiresAt });
        const setPasswordUrl = `${frontendUrl}/set-password?token=${encodeURIComponent(rawToken)}`;
        await this.emailService.sendEmail({
          from: customerFrom,
          to: email,
          replyTo: adminEmail,
          subject: 'Your Rose Associates portal access (set password)',
          html: buildPortalInviteTemplate(
            {
              firstName: inquiry.firstName,
              setPasswordUrl,
              organizationName: inquiry.organizationName,
            },
            logoUrl,
          ),
          attachments,
        });
        await inquiry.update({
          status: 'invited',
          userId: existing.id,
          invitedAt: new Date(),
        });
        return {
          success: true,
          alreadyRegistered: false,
          resentInvite: true,
          message: 'Invite re-sent. The prospect must set their password via the email link.',
          userId: existing.id,
        };
      }

      const loginUrl = `${frontendUrl}/login`;
      await this.emailService.sendEmail({
        from: customerFrom,
        to: email,
        replyTo: adminEmail,
        subject: 'Sign in to your Rose Associates portal',
        html: buildAlreadyRegisteredLoginTemplate(
          { firstName: inquiry.firstName, loginUrl },
          logoUrl,
        ),
        attachments,
      });
      await inquiry.update({
        userId: existing.id,
        status: existing.status === 'active' ? 'registered' : inquiry.status,
      });
      return {
        success: true,
        alreadyRegistered: true,
        message: 'This email already has an account. A sign-in reminder was sent.',
        userId: existing.id,
      };
    }

    const { rawToken, tokenHash, expiresAt } = await this.createInviteToken();
    const placeholderPassword = await this.passwordService.hash(crypto.randomBytes(32).toString('hex'));
    const fullName = `${inquiry.firstName} ${inquiry.lastName}`.trim();

    const user = await this.userModel.create({
      name: fullName,
      email,
      password: placeholderPassword,
      role: 'customer',
      subscriptionStatus: 'none',
      subscriptionPackage: null,
      subscribedAt: null,
      subscriptionExpiresAt: null,
      department: inquiry.organizationName || 'Planning Board',
      status: 'pending',
      avatarBg: 'bg-slate-700 text-white',
      avatarUrl: null,
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
      leadRole: inquiry.leadRole,
      jurisdictionType,
      lastActive: null,
    });

    const setPasswordUrl = `${frontendUrl}/set-password?token=${encodeURIComponent(rawToken)}`;
    await this.emailService.sendEmail({
      from: customerFrom,
      to: email,
      replyTo: adminEmail,
      subject: 'Your Rose Associates portal access — set your password',
      html: buildPortalInviteTemplate(
        {
          firstName: inquiry.firstName,
          setPasswordUrl,
          organizationName: inquiry.organizationName,
        },
        logoUrl,
      ),
      attachments,
    });

    await inquiry.update({ status: 'invited', userId: user.id, invitedAt: new Date()});

    return {
      success: true,
      alreadyRegistered: false,
      message: 'Portal invite sent. The prospect will set a password via email.',
      userId: user.id,
    };
  }

  async resendLogin(inquiryId: string) {
    const inquiry = await this.inquiryModel.findByPk(inquiryId);
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    if (!GOV_ROLES.has(inquiry.leadRole)) {
      throw new ForbiddenException('Login reminders are only for County / City leads.');
    }

    const email = inquiry.businessEmail.trim().toLowerCase();
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('No account exists for this email. Use Send portal access first.');
    }

    if (user.status === 'pending') {
      return this.sendPortalAccess(inquiryId);
    }

    const { logoUrl, attachments, customerFrom, adminEmail } = this.mailExtras();
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').replace(/\/+$/, '');
    const loginUrl = `${frontendUrl}/login`;

    await this.emailService.sendEmail({
      from: customerFrom,
      to: email,
      replyTo: adminEmail,
      subject: 'Sign in to your Rose Associates portal',
      html: buildAlreadyRegisteredLoginTemplate({ firstName: inquiry.firstName, loginUrl }, logoUrl),
      attachments,
    });

    return {
      success: true,
      message: 'Sign-in reminder emailed to the prospect.',
    };
  }

  private async createInviteToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    return { rawToken, tokenHash, expiresAt };
  }

  private mailExtras() {
    const adminEmail = this.configService.get<string>('ADMIN_INQUIRY_EMAIL', 'info@roseassociates.com');
    const configuredLogoUrl = this.configService.get<string>('APP_LOGO_URL');
    const localLogoPath = path.resolve(process.cwd(), 'assets', 'logo.png');
    const hasLocalLogo = fs.existsSync(localLogoPath);
    const logoUrl = configuredLogoUrl || (hasLocalLogo ? 'cid:roselogo' : '/logo.png');
    const attachments = !configuredLogoUrl && hasLocalLogo ? [{ filename: 'logo.png', path: localLogoPath, cid: 'roselogo' }] : [];
    const smtpUser = this.configService.get<string>('SMTP_USER', 'info@roseassociates.com');
    const customerFrom = this.configService.get<string>('MAIL_FROM') || `"Rose Associates Southeast" <${smtpUser}>`;
    return { logoUrl, attachments, customerFrom, adminEmail };
  }

  private async dispatchEmails(dto: CreateInquiryDto, inquiryId: string): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_INQUIRY_EMAIL', 'info@roseassociates.com');
    const { logoUrl, attachments, customerFrom } = this.mailExtras();
    const smtpUser = this.configService.get<string>('SMTP_USER', 'info@roseassociates.com');
    const adminFrom = this.configService.get<string>('MAIL_FROM_PORTAL') || `"Rose Associates Portal" <${smtpUser}>`;

    const emailData: InquiryEmailData = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      organizationName: dto.organizationName,
      jobTitle: dto.jobTitle,
      businessEmail: dto.businessEmail,
      phoneNumber: dto.phoneNumber,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      organizationType: dto.organizationType,
      leadRole: dto.leadRole,
      notes: dto.notes,
    };

    const isGovLead = dto.leadRole === 'county' || dto.leadRole === 'city';
    let brochureUrl: string | null = null;
    if (isGovLead) {
      brochureUrl = await this.pricingBrochureService.createPrivateBrochureLink();
    }

    const customerHtml = isGovLead ? buildCustomerCountyCityAcknowledgementTemplate(emailData, logoUrl, brochureUrl) : buildCustomerAcknowledgementTemplate(emailData, logoUrl);

    try {
      await this.emailService.sendEmail({
        from: adminFrom,
        to: adminEmail,
        replyTo: dto.businessEmail,
        subject: `New Enterprise Inquiry: ${dto.organizationName} - ${dto.firstName} ${dto.lastName}`,
        html: buildAdminInquiryNotificationTemplate(emailData, logoUrl),
        attachments,
      });
      await this.emailService.sendEmail({
        from: customerFrom,
        to: dto.businessEmail,
        replyTo: adminEmail,
        subject: isGovLead ? 'Your Prosperity Builder Scorecard inquiry – Rose Associates Southeast' : 'Thank you for your inquiry – Rose Associates Southeast',
        html: customerHtml,
        attachments,
      });
    } catch (err: unknown) {
      this.logger.error(`Failed to send emails for inquiry ${inquiryId}: ${getErrorMessage(err)}`, getErrorStack(err));
    }
  }
}
