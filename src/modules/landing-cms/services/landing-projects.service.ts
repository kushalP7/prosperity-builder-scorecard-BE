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
  }): Promise<LandingProject[]> {
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

    if (query?.search) {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: search } },
        { studyType: { [Op.iLike]: search } },
        { category: { [Op.iLike]: search } },
      ];
    }

    return this.projectModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
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

    // If PDF changed and old PDF was on Cloudinary, delete old PDF
    if (dto.pdfUrl && dto.pdfUrl !== project.pdfUrl && project.pdfUrl?.includes('res.cloudinary.com')) {
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
