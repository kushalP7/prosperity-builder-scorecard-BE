import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LandingProject } from '../entities/landing-project.entity';
import { CreateLandingProjectDto } from '../dto/create-landing-project.dto';
import { UpdateLandingProjectDto } from '../dto/update-landing-project.dto';
import { UploadsService } from '../../uploads/uploads.service';
import { Op } from 'sequelize';

@Injectable()
export class LandingProjectsService {
  constructor(
    @InjectModel(LandingProject)
    private readonly projectModel: typeof LandingProject,
    private readonly uploadsService: UploadsService,
  ) {}

  async findAll(query?: {
    category?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const where: any = { deleted: false };

    if (query?.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (query?.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query?.featured !== undefined) {
      where.featured = query.featured;
    }

    if (query?.search && query.search.trim()) {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: search } },
        { studyType: { [Op.iLike]: search } },
        { category: { [Op.iLike]: search } },
      ];
    }

    let order: any[] = [['createdAt', 'DESC']];
    if (query?.sortBy === 'oldest') {
      order = [['createdAt', 'ASC']];
    } else if (query?.sortBy === 'title_asc') {
      order = [['title', 'ASC']];
    } else if (query?.sortBy === 'title_desc') {
      order = [['title', 'DESC']];
    }

    if (query?.page !== undefined || query?.limit !== undefined) {
      const pageNum = Math.max(1, Number(query.page) || 1);
      const limitNum = Math.max(1, Number(query.limit) || 10);
      const offset = (pageNum - 1) * limitNum;

      const { rows, count } = await this.projectModel.findAndCountAll({
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

    return this.projectModel.findAll({
      where,
      order,
    });
  }

  async findById(id: string): Promise<LandingProject> {
    const project = await this.projectModel.findOne({
      where: { id, deleted: false },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async create(dto: CreateLandingProjectDto): Promise<LandingProject> {
    return this.projectModel.create({
      ...dto,
      featured: dto.featured !== undefined ? dto.featured : true,
      status: dto.status || 'published',
      deleted: false,
    });
  }

  async update(id: string, dto: UpdateLandingProjectDto): Promise<LandingProject> {
    const project = await this.findById(id);

    // If PDF changed and old PDF was in storage, delete old PDF
    if (dto.pdfUrl && dto.pdfUrl !== project.pdfUrl && project.pdfUrl && this.uploadsService.isManagedUrl(project.pdfUrl)) {
      await this.uploadsService.deleteFileByUrl(project.pdfUrl);
    }

    await project.update(dto);
    return project;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const project = await this.findById(id);

    // Soft delete: mark as deleted, preserve Cloudinary assets
    await project.update({
      deleted: true,
      deletedAt: new Date(),
    });

    return { success: true, message: 'Project soft-deleted successfully' };
  }
}
