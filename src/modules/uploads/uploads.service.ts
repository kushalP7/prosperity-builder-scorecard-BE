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

    this.logger.log(`Active storage driver: "${this.driver}", environment prefix: "${this.getEnvPrefix()}"`);
  }

  getActiveDriver(): string {
    return this.driver;
  }

  getEnvPrefix(): string {
    const envPrefix = (process.env.STORAGE_ENV_PREFIX || '').trim();
    if (envPrefix) {
      return envPrefix;
    }
    return (process.env.NODE_ENV || '').toLowerCase() === 'production' ? 'prod' : 'dev';
  }

  resolveFolderPath(category: string = 'reports'): string {
    const envPrefix = this.getEnvPrefix();
    const raw = (category || 'reports').trim();
    const normalized = raw.toLowerCase();

    // If it already starts with Rose/<envPrefix>/, return as is
    if (raw.startsWith(`Rose/${envPrefix}/`)) {
      return raw;
    }

    // If it starts with Rose/ (e.g. legacy Rose/Reports or Rose/Media), inject the envPrefix
    if (raw.startsWith('Rose/')) {
      return raw.replace(/^Rose\//, `Rose/${envPrefix}/`);
    }

    let subPath = 'Reports';
    if (normalized.includes('audio')) {
      subPath = 'Media/Audio';
    } else if (normalized.includes('video')) {
      subPath = 'Media/Video';
    } else if (normalized.includes('pdf')) {
      subPath = 'Media/PDF';
    } else if (normalized.includes('media')) {
      subPath = 'Media';
    } else if (normalized.includes('report')) {
      subPath = 'Reports';
    } else if (normalized.includes('project')) {
      subPath = 'Project_Partners';
    } else if (normalized.includes('logo')) {
      subPath = 'logo';
    } else {
      subPath = raw.replace(/^\/+|\/+$/g, '');
    }

    return `Rose/${envPrefix}/${subPath}`;
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
    folder?: string,
    resourceType: 'auto' | 'image' | 'raw' | 'video' = 'auto',
  ): Promise<StorageUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const resolvedFolder = this.resolveFolderPath(folder || 'reports');
    return this.activeProvider.uploadFile(file, resolvedFolder, resourceType);
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
