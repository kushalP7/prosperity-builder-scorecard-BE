import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { IStorageProvider, StorageUploadResult } from '../interfaces/storage.interface';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
      api_key: process.env.CLOUDINARY_API_KEY?.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
    });
  }

  isManagedUrl(url: string): boolean {
    return typeof url === 'string' && url.includes('res.cloudinary.com');
  }

  extractCloudinaryDetails(url: string): { publicId: string; resourceType: 'image' | 'raw' | 'video' } | null {
    if (!this.isManagedUrl(url)) {
      return null;
    }

    try {
      // url pattern: .../res.cloudinary.com/<cloud_name>/<resource_type>/upload/(s--...--/)?(v[0-9]+/)?<public_id>
      const match = url.match(/\/res\.cloudinary\.com\/[^\/]+\/(image|raw|video)\/upload\/(?:[^\/]+\/)?(?:v\d+\/)?(.+)$/);
      if (!match) return null;

      const resourceType = match[1] as 'image' | 'raw' | 'video';
      let publicId = match[2];

      if (resourceType === 'image') {
        publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
      }

      return { publicId, resourceType };
    } catch {
      return null;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'Rose/Reports',
    resourceType: 'auto' | 'image' | 'raw' | 'video' = 'auto',
  ): Promise<StorageUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(new BadRequestException(`Cloudinary upload failed: ${error.message}`));
          }
          if (!result) {
            return reject(new BadRequestException('Cloudinary upload returned no result'));
          }

          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format || file.mimetype.split('/')[1] || 'raw',
            bytes: result.bytes,
            originalName: file.originalname,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image',
  ): Promise<{ success: boolean; result?: string }> {
    if (!publicId) {
      return { success: false, result: 'No publicId provided' };
    }

    try {
      const type = resourceType === 'auto' ? 'image' : resourceType;
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
        invalidate: true,
      });

      if (result.result === 'not found' && resourceType === 'auto') {
        const rawResult = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
          invalidate: true,
        });
        return { success: rawResult.result === 'ok', result: rawResult.result };
      }

      return { success: result.result === 'ok', result: result.result };
    } catch (error: any) {
      this.logger.error(`Cloudinary delete failed: ${error.message}`);
      return { success: false, result: error?.message || 'Failed to delete file from Cloudinary' };
    }
  }

  async deleteFileByUrl(url: string): Promise<{ success: boolean; result?: string }> {
    const details = this.extractCloudinaryDetails(url);
    if (!details) {
      return { success: false, result: 'Not a recognized Cloudinary URL' };
    }
    return this.deleteFile(details.publicId, details.resourceType);
  }
}
