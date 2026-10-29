import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LandingPartner } from '../entities/landing-partner.entity';
import { CreateLandingPartnerDto } from '../dto/create-landing-partner.dto';
import { UpdateLandingPartnerDto } from '../dto/update-landing-partner.dto';
import { UploadsService } from '../../uploads/uploads.service';
import { Op } from 'sequelize';

@Injectable()
export class LandingPartnersService {
  constructor(
    @InjectModel(LandingPartner)
    private readonly partnerModel: typeof LandingPartner,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(query?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const where: any = { deleted: false };

    if (query?.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query?.search && query.search.trim()) {
      const search = `%${query.search.trim()}%`;
      where.name = { [Op.iLike]: search };
    }

    const order: any[] = [
      ['sortOrder', 'ASC'],
      ['createdAt', 'ASC'],
    ];

    if (query?.page !== undefined || query?.limit !== undefined) {
      const pageNum = Math.max(1, Number(query.page) || 1);
      const limitNum = Math.max(1, Number(query.limit) || 10);
      const offset = (pageNum - 1) * limitNum;

      const { rows, count } = await this.partnerModel.findAndCountAll({
        where,
        order,
        limit: limitNum,
        offset,
      });

      return {
        data: rows,
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1,
      };
    }

    return this.partnerModel.findAll({
      where,
      order,
    });
  }

  async findById(id: string): Promise<LandingPartner> {
    const partner = await this.partnerModel.findOne({
      where: { id, deleted: false },
    });
    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }
    return partner;
  }

  async create(dto: CreateLandingPartnerDto): Promise<LandingPartner> {
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined || sortOrder === null) {
      const maxRow = await this.partnerModel.findOne({
        where: { deleted: false },
        order: [['sortOrder', 'DESC']],
      });
      sortOrder = (maxRow?.sortOrder ?? -1) + 1;
    }

    return this.partnerModel.create({
      name: dto.name,
      logoUrl: dto.logoUrl,
      sortOrder,
      status: dto.status || 'published',
      deleted: false,
    });
  }

  async update(id: string, dto: UpdateLandingPartnerDto): Promise<LandingPartner> {
    const partner = await this.findById(id);

    if (dto.logoUrl && dto.logoUrl !== partner.logoUrl && partner.logoUrl && this.uploadsService.isManagedUrl(partner.logoUrl)) {
      await this.uploadsService.deleteFileByUrl(partner.logoUrl);
    }

    await partner.update(dto);
    return partner;
  }

  async move(id: string, direction: 'up' | 'down'): Promise<LandingPartner> {
    const partner = await this.findById(id);

    const neighbor = await this.partnerModel.findOne({
      where: {
        deleted: false,
        sortOrder: direction === 'up' ? { [Op.lt]: partner.sortOrder } : { [Op.gt]: partner.sortOrder },
      },
      order: direction === 'up' ? [['sortOrder', 'DESC']] : [['sortOrder', 'ASC']],
    });

    if (!neighbor) {
      throw new BadRequestException(
        direction === 'up' ? 'Partner is already at the top' : 'Partner is already at the bottom',
      );
    }

    const currentOrder = partner.sortOrder;
    const neighborOrder = neighbor.sortOrder;

    await partner.update({ sortOrder: neighborOrder });
    await neighbor.update({ sortOrder: currentOrder });

    return partner.reload();
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const partner = await this.findById(id);

    await partner.update({
      deleted: true,
      deletedAt: new Date(),
    });

    return { success: true, message: 'Partner soft-deleted successfully' };
  }
}
