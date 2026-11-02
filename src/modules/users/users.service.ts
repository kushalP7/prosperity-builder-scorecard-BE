import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { SubscriptionStatus, User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from '../auth/services/password.service';

const CUSTOMER_ROLE_ALIASES = new Set(['customer', 'subscriber', 'client_viewer', 'viewer']);

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly passwordService: PasswordService,
  ) { }

  async findAll(options?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  } | string) {
    let search: string | undefined;
    let role: string | undefined;
    let status: string | undefined;
    let page: number | undefined;
    let limit: number | undefined;

    if (typeof options === 'string') {
      search = options;
    } else if (options && typeof options === 'object') {
      search = options.search;
      role = options.role;
      status = options.status;
      page = options.page;
      limit = options.limit;
    }

    const where: any = {};
    if (search?.trim()) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search.trim()}%` } },
        { email: { [Op.iLike]: `%${search.trim()}%` } },
        { department: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }
    if (role && role !== 'all') {
      if (role === 'customer') {
        where.role = { [Op.in]: ['customer', 'subscriber', 'client_viewer', 'viewer'] };
      } else {
        where.role = role;
      }
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'refreshTokenHash'] },
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    return {
      data: rows.map((u) => u.toJSON()),
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum) || 1,
    };
  }

  async findById(id: string) {
    const user = await this.userModel.findByPk(id, {
      attributes: { exclude: ['password', 'refreshTokenHash'] },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user.toJSON();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userModel.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists.`);
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    // Pick avatar color based on role
    const avatarBgMap: Record<string, string> = {
      super_admin: 'bg-[#7c0d15] text-white',
      project_lead: 'bg-blue-600 text-white',
      assessment_specialist: 'bg-emerald-600 text-white',
      customer: 'bg-slate-700 text-white',
    };
    const role = dto.role || 'customer';
    const isCustomer = role === 'customer';

    const user = await this.userModel.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      subscriptionStatus: dto.subscriptionStatus || (isCustomer ? 'none' : 'none'),
      subscriptionPackage: null,
      subscribedAt: null,
      subscriptionExpiresAt: null,
      department: dto.department || 'Planning Board',
      status: dto.status || 'active',
      avatarBg: avatarBgMap[role] || 'bg-slate-700 text-white',
      avatarUrl: null,
      lastActive: new Date(),
    });

    const result = user.toJSON();
    delete result.password;
    delete result.refreshTokenHash;
    return result;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.email && dto.email.trim().toLowerCase() !== user.email) {
      const existing = await this.userModel.findOne({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (existing) {
        throw new ConflictException(`Email '${dto.email}' is already in use.`);
      }
      user.email = dto.email.trim().toLowerCase();
    }

    if (dto.name) user.name = dto.name.trim();
    if (dto.department !== undefined) user.department = dto.department;
    if (dto.status) user.status = dto.status;

    if (dto.role) {
      user.role = dto.role;
      const avatarBgMap: Record<string, string> = {
        super_admin: 'bg-[#7c0d15] text-white',
        project_lead: 'bg-blue-600 text-white',
        assessment_specialist: 'bg-emerald-600 text-white',
        customer: 'bg-slate-700 text-white',
        subscriber: 'bg-slate-700 text-white',
        client_viewer: 'bg-slate-700 text-white',
        admin: 'bg-[#7c0d15] text-white',
        manager: 'bg-blue-600 text-white',
        analyst: 'bg-emerald-600 text-white',
        viewer: 'bg-slate-700 text-white',
      };
      user.avatarBg = avatarBgMap[dto.role] || user.avatarBg;
    }

    if (dto.subscriptionStatus) {
      user.subscriptionStatus = dto.subscriptionStatus;
      if (dto.subscriptionStatus === 'active' && !user.subscribedAt) {
        user.subscribedAt = new Date();
      }
      if (dto.subscriptionStatus === 'active' && !user.subscriptionExpiresAt) {
        const base = user.subscribedAt ? new Date(user.subscribedAt) : new Date();
        const expires = new Date(base);
        expires.setFullYear(expires.getFullYear() + 1);
        user.subscriptionExpiresAt = expires;
      }
      if (dto.subscriptionStatus === 'cancelled' || dto.subscriptionStatus === 'expired') {
        // keep expiresAt for history; status drives access
      }
    }
    if (dto.subscriptionPackage !== undefined) {
      user.subscriptionPackage = dto.subscriptionPackage || null;
    }

    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl?.trim() || null;
    }

    if (dto.password) {
      user.password = await this.passwordService.hash(dto.password);
    }

    await user.save();

    const result = user.toJSON();
    delete result.password;
    delete result.refreshTokenHash;
    return result;
  }

  /**
   * Activate paid entitlement for a customer account (role unchanged).
   * Matches by email; no-ops if no user or non-customer role.
   */
  async activateSubscriptionByEmail(
    email: string,
    packageType?: string,
    userId?: string | null,
  ): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    let user: User | null = null;
    if (userId) {
      user = await this.userModel.findByPk(userId);
    }
    if (!user) {
      user = await this.userModel.findOne({ where: { email: normalized } });
    }
    if (!user || !CUSTOMER_ROLE_ALIASES.has(String(user.role))) {
      return null;
    }

    const now = new Date();
    const currentExpiry = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt)
      : null;
    const base =
      currentExpiry && !Number.isNaN(currentExpiry.getTime()) && currentExpiry > now
        ? currentExpiry
        : now;
    const subscriptionExpiresAt = new Date(base);
    subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);

    await user.update({
      role: 'customer' as UserRole,
      subscriptionStatus: 'active' as SubscriptionStatus,
      subscriptionPackage: packageType || user.subscriptionPackage || null,
      subscribedAt: user.subscribedAt || now,
      subscriptionExpiresAt,
    });
    return user;
  }

  /**
   * Mark subscription expired when subscriptionExpiresAt is in the past.
   * Called from auth getMe / login so access stays in sync.
   */
  async syncExpiredSubscription(user: User): Promise<User> {
    if (
      user.subscriptionStatus === 'active' &&
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt).getTime() < Date.now()
    ) {
      await user.update({ subscriptionStatus: 'expired' as SubscriptionStatus });
      await user.reload();
    }
    return user;
  }

  /**
   * After refund: cancel entitlement unless another paid order remains for this email.
   */
  async syncSubscriptionAfterRefund(
    email: string,
    hasOtherActivePaidOrders: boolean,
  ): Promise<User | null> {
    const user = await this.userModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !CUSTOMER_ROLE_ALIASES.has(String(user.role))) {
      return null;
    }

    if (hasOtherActivePaidOrders) {
      await user.update({
        role: 'customer' as UserRole,
        subscriptionStatus: 'active' as SubscriptionStatus,
      });
    } else {
      await user.update({
        role: 'customer' as UserRole,
        subscriptionStatus: 'cancelled' as SubscriptionStatus,
        subscriptionExpiresAt: null,
      });
    }
    return user;
  }

  async delete(id: string) {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await user.destroy();
    return { success: true, message: `User '${user.name}' deleted successfully.` };
  }

  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.userModel.update({ refreshTokenHash: hash }, { where: { id: userId } });
  }

  async updateLastActive(userId: string) {
    await this.userModel.update({ lastActive: new Date() }, { where: { id: userId } });
  }
}
