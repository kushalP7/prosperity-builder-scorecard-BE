import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User, UserRole } from '../users/entities/user.entity';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Registers a new user with Argon2-hashed password and default 'client_viewer' role.
   */
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(`An account with email '${email}' already exists.`);
    }

    const hashedPassword = await this.passwordService.hash(dto.password);
    const defaultRole: UserRole = 'client_viewer';

    const avatarBgMap: Record<string, string> = {
      super_admin: 'bg-[#7c0d15] text-white',
      project_lead: 'bg-blue-600 text-white',
      assessment_specialist: 'bg-emerald-600 text-white',
      client_viewer: 'bg-slate-700 text-white',
    };

    const user = await this.userModel.create({
      name: dto.name.trim(),
      email,
      password: hashedPassword,
      role: defaultRole,
      department: dto.department || 'Planning Board',
      status: 'active',
      avatarBg: avatarBgMap[defaultRole],
      lastActive: new Date(),
    });

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
      throw new UnauthorizedException('Your account is pending administrator approval. Please try again later.');
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
    } catch (err: any) {
      this.logger.warn(`Token refresh error: ${err.message}`);
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
    return {
      success: true,
      data: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: User) {
    const json = user.toJSON();
    delete json.password;
    delete json.refreshTokenHash;
    return json;
  }
}
