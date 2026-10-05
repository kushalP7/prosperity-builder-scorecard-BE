import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3StorageProvider } from './providers/s3.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary.provider';
import { IStorageProvider, StorageUploadResult } from './interfaces/storage.interface';
import 'multer';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly activeProvider: IStorageProvider;
  private readonly driver: string;

  constructor(
    private readonly s3Provider: S3StorageProvider,
    private readonly cloudinaryProvider: CloudinaryStorageProvider,
  ) {
    // Driver can be 'minio', 's3', or 'cloudinary'
    // Default to 'minio' (or 's3') as requested
    const envDriver = (process.env.STORAGE_DRIVER || '').toLowerCase().trim();
    if (envDriver === 'cloudinary') {
      this.driver = 'cloudinary';
      this.activeProvider = this.cloudinaryProvider;
    } else {
      // Default to S3/MinIO
      this.driver = envDriver || 'minio';
      this.activeProvider = this.s3Provider;
    }

    this.logger.log(`Active storage driver: "${this.driver}"`);
  }

  getActiveDriver(): string {
    return this.driver;
  }

  resolveFolderPath(category: string = 'reports'): string {
    const raw = (category || 'reports').trim();
    const normalized = raw.toLowerCase();

    if (normalized.includes('audio')) {
      return 'Rose/Media/Audio';
    }
    if (normalized.includes('video')) {
      return 'Rose/Media/Video';
    }
    if (normalized.includes('pdf')) {
      return 'Rose/Media/PDF';
    }
    if (normalized.includes('media')) {
      return 'Rose/Media';
    }
    if (normalized.includes('report')) {
      return 'Rose/Reports';
    }
    if (normalized.includes('project')) {
      return 'Rose/Project_Partners';
    }
    if (raw.startsWith('Rose/')) {
      return raw;
    }
    return `Rose/${category}`;
  }

  isManagedUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return this.cloudinaryProvider.isManagedUrl(url) || this.s3Provider.isManagedUrl(url);
  }

  extractCloudinaryDetails(url: string): { publicId: string; resourceType: 'image' | 'raw' | 'video' } | null {
    return this.cloudinaryProvider.extractCloudinaryDetails(url);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'Rose/Reports',
    resourceType: 'auto' | 'image' | 'raw' | 'video' = 'auto',
  ): Promise<StorageUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.activeProvider.uploadFile(file, folder, resourceType);
  }

  async deleteFileByUrl(url: string): Promise<{ success: boolean; result?: string }> {
    if (!url || typeof url !== 'string') {
      return { success: false, result: 'No URL provided' };
    }

    // Intelligently route deletion based on URL origin
    if (this.cloudinaryProvider.isManagedUrl(url)) {
      return this.cloudinaryProvider.deleteFileByUrl(url);
    }

    if (this.s3Provider.isManagedUrl(url)) {
      return this.s3Provider.deleteFileByUrl(url);
    }

    // Try active provider as fallback
    return this.activeProvider.deleteFileByUrl(url);
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image',
  ): Promise<{ success: boolean; result?: string }> {
    if (!publicId) {
      return { success: false, result: 'No publicId provided' };
    }

    // If key contains folder path and active driver is MinIO/S3, delete from S3
    if (this.driver !== 'cloudinary') {
      return this.s3Provider.deleteFile(publicId);
    }

    return this.cloudinaryProvider.deleteFile(publicId, resourceType);
  }
}
