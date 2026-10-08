import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LandingMedia } from '../entities/landing-media.entity';
import { CreateLandingMediaDto } from '../dto/create-landing-media.dto';
import { UpdateLandingMediaDto } from '../dto/update-landing-media.dto';
import { UploadsService } from '../../uploads/uploads.service';
import { Op } from 'sequelize';

@Injectable()
export class LandingMediaService {
  constructor(
    @InjectModel(LandingMedia)
    private readonly mediaModel: typeof LandingMedia,
    private readonly uploadsService: UploadsService,
  ) { }

  private collectCloudinaryUrls(media: Partial<LandingMedia>): string[] {
    const urls: string[] = [];
    if (media.sourceUrl && this.uploadsService.isManagedUrl(media.sourceUrl)) {
      urls.push(media.sourceUrl);
    }
    return urls;
  }

  async findAll(query?: {
    mediaType?: string;
    category?: string;
    status?: string;
    search?: string;
    featured?: boolean;
    year?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const where: any = { deleted: false };

    if (query?.mediaType && query.mediaType !== 'all') {
      where.mediaType = query.mediaType;
    }

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
        { description: { [Op.iLike]: search } },
        { category: { [Op.iLike]: search } },
      ];
    }

    if (query?.year && query.year !== 'all') {
      const startOfYear = new Date(`${query.year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${query.year}-12-31T23:59:59.999Z`);
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          createdAt: { [Op.between]: [startOfYear, endOfYear] },
        },
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

      const { rows, count } = await this.mediaModel.findAndCountAll({
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

    return this.mediaModel.findAll({
      where,
      order,
    });
  }

  private sanitizeMediaDto<T extends Partial<CreateLandingMediaDto | UpdateLandingMediaDto>>(
    dto: T,
    existingMediaType?: string,
  ): T {
    const sanitized: any = { ...dto };
    const effectiveMediaType = sanitized.mediaType || existingMediaType;

    if (effectiveMediaType === 'document') {
      sanitized.videoSource = null;
      sanitized.audioSource = null;
    } else if (effectiveMediaType === 'audio') {
      sanitized.videoSource = null;
    } else if (effectiveMediaType === 'video') {
      sanitized.audioSource = null;
    }

    return sanitized;
  }

  async findOne(id: string): Promise<LandingMedia> {
    const media = await this.mediaModel.findOne({
      where: { id, deleted: false },
    });
    if (!media) {
      throw new NotFoundException(`Media item with ID ${id} not found`);
    }
    return media;
  }

  async create(dto: CreateLandingMediaDto): Promise<LandingMedia> {
    const sanitizedDto = this.sanitizeMediaDto(dto);
    return this.mediaModel.create({
      ...sanitizedDto,
      deleted: false,
    } as any);
  }

  async update(id: string, dto: UpdateLandingMediaDto): Promise<LandingMedia> {
    const media = await this.findOne(id);
    const prevUrls = this.collectCloudinaryUrls(media);
    const sanitizedDto = this.sanitizeMediaDto(dto, media.mediaType);

    await media.update(sanitizedDto);
    const updatedMedia = await this.findOne(id);

    // Clean up replaced Cloudinary files
    const newUrls = new Set(this.collectCloudinaryUrls(updatedMedia));
    const orphanedUrls = prevUrls.filter((url) => !newUrls.has(url));

    for (const url of orphanedUrls) {
      try {
        await this.uploadsService.deleteFileByUrl(url);
      } catch (err) {
        console.warn(`[LandingMediaService] Failed to clean up Cloudinary asset ${url}:`, err);
      }
    }

    return updatedMedia;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const media = await this.findOne(id);

    // Soft delete: mark as deleted, preserve Cloudinary assets
    await media.update({
      deleted: true,
      deletedAt: new Date(),
    });

    return { success: true, message: `Media item ${id} soft-deleted successfully` };
  }
}
