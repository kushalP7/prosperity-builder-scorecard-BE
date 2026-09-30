import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from '../auth/services/password.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly passwordService: PasswordService,
  ) {}

  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await this.userModel.findAll({
      where,
      attributes: { exclude: ['password', 'refreshTokenHash'] },
      order: [['createdAt', 'DESC']],
    });

    return users.map((u) => u.toJSON());
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
        client_viewer: 'bg-slate-700 text-white',
      };
    const role = dto.role || 'client_viewer';

    const user = await this.userModel.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      department: dto.department || 'Planning Board',
      status: dto.status || 'active',
      avatarBg: avatarBgMap[role] || 'bg-slate-700 text-white',
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
        client_viewer: 'bg-slate-700 text-white',
        admin: 'bg-[#7c0d15] text-white',
        manager: 'bg-blue-600 text-white',
        analyst: 'bg-emerald-600 text-white',
        viewer: 'bg-slate-700 text-white',
      };
      user.avatarBg = avatarBgMap[dto.role] || user.avatarBg;
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
