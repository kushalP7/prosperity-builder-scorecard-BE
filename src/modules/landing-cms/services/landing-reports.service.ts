import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LandingReport } from '../entities/landing-report.entity';
import { CreateLandingReportDto } from '../dto/create-landing-report.dto';
import { UpdateLandingReportDto } from '../dto/update-landing-report.dto';
import { UploadsService } from '../../uploads/uploads.service';
import { Op } from 'sequelize';

@Injectable()
export class LandingReportsService {
  constructor(
    @InjectModel(LandingReport)
    private readonly reportModel: typeof LandingReport,
    private readonly uploadsService: UploadsService,
  ) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  private collectCloudinaryUrls(report: Partial<LandingReport>): string[] {
    const urls: string[] = [];
    if (report.coverImage && report.coverImage.includes('res.cloudinary.com')) {
      urls.push(report.coverImage);
    }
    if (report.pdfUrl && report.pdfUrl.includes('res.cloudinary.com')) {
      urls.push(report.pdfUrl);
    }

    if (Array.isArray(report.blocks)) {
      report.blocks.forEach((block: any) => {
        if (block?.pdfUrl && block.pdfUrl.includes('res.cloudinary.com')) {
          urls.push(block.pdfUrl);
        }
        if (Array.isArray(block?.images)) {
          block.images.forEach((img: any) => {
            if (img?.url && img.url.includes('res.cloudinary.com')) {
              urls.push(img.url);
            }
          });
        }
        if (Array.isArray(block?.files)) {
          block.files.forEach((f: any) => {
            if (f?.url && f.url.includes('res.cloudinary.com')) {
              urls.push(f.url);
            }
          });
        }
        if (Array.isArray(block?.items)) {
          block.items.forEach((item: any) => {
            if (item?.imageUrl && item.imageUrl.includes('res.cloudinary.com')) {
              urls.push(item.imageUrl);
            }
          });
        }
      });
    }

    return urls;
  }

  async findAll(status?: string, featuredOnly?: boolean, search?: string): Promise<LandingReport[]> {
    const where: any = { deleted: false };
    if (status) {
      where.status = status;
    }
    if (featuredOnly) {
      where.featured = true;
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { summary: { [Op.iLike]: `%${search}%` } },
      ];
    }
    return this.reportModel.findAll({
      where,
      order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']],
    });
  }

  async findBySlug(slug: string): Promise<LandingReport> {
    const report = await this.reportModel.findOne({ where: { slug, deleted: false } });
    if (!report) {
      throw new NotFoundException(`Report with slug "${slug}" not found`);
    }
    return report;
  }

  async findById(id: string): Promise<LandingReport> {
    const report = await this.reportModel.findOne({ where: { id, deleted: false } });
    if (!report) {
      throw new NotFoundException(`Report with ID "${id}" not found`);
    }
    return report;
  }

  async create(dto: CreateLandingReportDto): Promise<LandingReport> {
    let slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    
    // Check slug collision
    const existing = await this.reportModel.findOne({ where: { slug, deleted: false } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    return this.reportModel.create({
      ...dto,
      slug,
      deleted: false,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
    });
  }

  async update(id: string, dto: UpdateLandingReportDto): Promise<LandingReport> {
    const report = await this.findById(id);

    if (dto.slug && dto.slug !== report.slug) {
      const formattedSlug = this.slugify(dto.slug);
      const existing = await this.reportModel.findOne({ where: { slug: formattedSlug, deleted: false } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Slug "${formattedSlug}" is already taken`);
      }
      report.slug = formattedSlug;
    }

    // Clean up replaced coverImage or pdfUrl from Cloudinary if replaced
    if (dto.coverImage !== undefined && dto.coverImage !== report.coverImage && report.coverImage?.includes('res.cloudinary.com')) {
      this.uploadsService.deleteFileByUrl(report.coverImage).catch(() => {});
    }
    if (dto.pdfUrl !== undefined && dto.pdfUrl !== report.pdfUrl && report.pdfUrl?.includes('res.cloudinary.com')) {
      this.uploadsService.deleteFileByUrl(report.pdfUrl).catch(() => {});
    }

    if (dto.title !== undefined) report.title = dto.title;
    if (dto.subtitle !== undefined) report.subtitle = dto.subtitle;
    if (dto.author !== undefined) report.author = dto.author;
    if (dto.coverImage !== undefined) report.coverImage = dto.coverImage;
    if (dto.pdfUrl !== undefined) report.pdfUrl = dto.pdfUrl;
    if (dto.summary !== undefined) report.summary = dto.summary;
    if (dto.contentHtml !== undefined) report.contentHtml = dto.contentHtml;
    if (dto.featured !== undefined) report.featured = dto.featured;
    if (dto.status !== undefined) report.status = dto.status;
    if (dto.blocks !== undefined) report.blocks = dto.blocks;
    if (dto.publishedAt !== undefined) {
      report.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : new Date();
    }

    await report.save();
    return report;
  }

  async delete(id: string): Promise<{ success: boolean; id: string; message: string }> {
    const report = await this.findById(id);

    // Soft delete: mark as deleted, preserve Cloudinary assets
    await report.update({
      deleted: true,
      deletedAt: new Date(),
    });

    return { success: true, id, message: 'Report soft-deleted successfully' };
  }
}
