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

  async findAll(query?: { mediaType?: string; category?: string; status?: string; search?: string; featured?: boolean; }): Promise<LandingMedia[]> {
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

    if (query?.search) {
      const search = `%${query.search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.iLike]: search } },
        { description: { [Op.iLike]: search } },
        { category: { [Op.iLike]: search } },
      ];
    }

    return this.mediaModel.findAll({
      where,
      order: [
        ['createdAt', 'DESC'],
      ],
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
