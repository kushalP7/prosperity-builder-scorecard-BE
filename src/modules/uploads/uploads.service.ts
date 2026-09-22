import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadsService {
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

  async uploadFile(file: Express.Multer.File, folder: string = 'Rose/Reports', resourceType: 'auto' | 'image' | 'raw' | 'video' = 'auto'): Promise<{ url: string; public_id: string; format: string; bytes: number; originalName: string }> {
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

  extractCloudinaryDetails(url: string): { publicId: string; resourceType: 'image' | 'raw' | 'video' } | null {
    if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
      return null;
    }

    try {
      // url pattern: .../res.cloudinary.com/<cloud_name>/<resource_type>/upload/(s--...--/)?(v[0-9]+/)?<public_id>
      const match = url.match(/\/res\.cloudinary\.com\/[^\/]+\/(image|raw|video)\/upload\/(?:[^\/]+\/)?(?:v\d+\/)?(.+)$/);
      if (!match) return null;

      const resourceType = match[1] as 'image' | 'raw' | 'video';
      let publicId = match[2];

      if (resourceType === 'image') {
        // Strip extension for images as Cloudinary identifies image public_ids without extension
        publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
      }

      return { publicId, resourceType };
    } catch {
      return null;
    }
  }

  async deleteFileByUrl(url: string): Promise<{ success: boolean; result?: string }> {
    const details = this.extractCloudinaryDetails(url);
    if (!details) {
      return { success: false, result: 'Not a recognized Cloudinary URL' };
    }

    return this.deleteFile(details.publicId, details.resourceType);
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'raw' | 'video' | 'auto' = 'image'): Promise<{ success: boolean; result?: string }> {
    if (!publicId) {
      return { success: false, result: 'No publicId provided' };
    }

    try {
      const type = resourceType === 'auto' ? 'image' : resourceType;
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
        invalidate: true,
      });

      // If destroying as image returned 'not found' and resourceType was auto, try raw
      if (result.result === 'not found' && resourceType === 'auto') {
        const rawResult = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
          invalidate: true,
        });
        return { success: rawResult.result === 'ok', result: rawResult.result };
      }

      return { success: result.result === 'ok', result: result.result };
    } catch (error: any) {
      return { success: false, result: error?.message || 'Failed to delete file from Cloudinary' };
    }
  }
}
