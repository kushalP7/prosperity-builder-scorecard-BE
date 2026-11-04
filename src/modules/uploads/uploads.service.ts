import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3StorageProvider } from './providers/s3.provider';
import { IStorageProvider, StorageUploadResult } from './interfaces/storage.interface';
import 'multer';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly activeProvider: IStorageProvider;
  private readonly driver: string;

  constructor(private readonly s3Provider: S3StorageProvider) {
    // Driver can be 'minio' or 's3' (both use the S3-compatible provider)
    const envDriver = (process.env.STORAGE_DRIVER || '').toLowerCase().trim();
    this.driver = envDriver === 's3' ? 's3' : envDriver || 'minio';
    this.activeProvider = this.s3Provider;

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
    } else if (normalized.includes('partner')) {
      subPath = 'partners';
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
    return this.s3Provider.isManagedUrl(url);
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

  /** Upload an in-memory buffer (e.g. generated PDF) as if it were a Multer file. */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    mimetype: string = 'application/pdf',
    folder?: string,
  ): Promise<StorageUploadResult> {
    if (!buffer?.length) {
      throw new BadRequestException('No file buffer provided');
    }
    const file = {
      fieldname: 'file',
      originalname: originalName,
      encoding: '7bit',
      mimetype,
      size: buffer.length,
      buffer,
    } as Express.Multer.File;
    return this.uploadFile(file, folder, 'raw');
  }

  async deleteFileByUrl(url: string): Promise<{ success: boolean; result?: string }> {
    if (!url || typeof url !== 'string') {
      return { success: false, result: 'No URL provided' };
    }
    return this.s3Provider.deleteFileByUrl(url);
  }

  async deleteFile(
    keyOrPublicId: string,
    _resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image',
  ): Promise<{ success: boolean; result?: string }> {
    if (!keyOrPublicId) {
      return { success: false, result: 'No publicId provided' };
    }
    return this.s3Provider.deleteFile(keyOrPublicId);
  }
}
