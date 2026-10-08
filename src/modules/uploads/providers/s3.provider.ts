import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as crypto from 'crypto';
import * as path from 'path';
import { IStorageProvider, StorageUploadResult } from '../interfaces/storage.interface';

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint?: string;
  private readonly publicUrl?: string;
  private readonly region: string;
  private bucketChecked = false;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || 'rose-media';
    this.endpoint = (process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT || process.env.MINIO_ENDPOINT || '').trim() || undefined;
    this.publicUrl = (process.env.S3_PUBLIC_URL || process.env.MINIO_PUBLIC_URL || '').trim() || undefined;

    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER || '').trim();
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD || '').trim();

    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== undefined
      ? process.env.S3_FORCE_PATH_STYLE === 'true'
      : !!this.endpoint; // Force path-style by default when using a custom endpoint (MinIO)

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle,
      credentials: accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
    });

    this.logger.log(
      `S3/MinIO Storage initialized (Bucket: "${this.bucket}", Region: "${this.region}", Endpoint: ${this.endpoint || 'AWS S3 Default'}, ForcePathStyle: ${forcePathStyle})`,
    );
  }

  private formatStorageError(error: any): string {
    const msg = error?.message || '';
    const code = error?.code || error?.name || '';

    // Log the full technical stack trace and codes in server logs for developers
    this.logger.error(`[Storage Tech Details] Code: "${code}", Message: "${msg}"`, error?.stack);

    // 1. Connection Refused or Reset (Storage container offline or network drop)
    if (code === 'ECONNREFUSED' || msg.includes('ECONNREFUSED') || code === 'ECONNRESET' || msg.includes('ECONNRESET')) {
      return "Unable to connect to the file storage service. Please make sure the storage service is running and try again.";
    }

    // 2. AWS S3 Region Mismatch or Misconfiguration
    if (msg.includes('specified endpoint') || msg.includes('PermanentRedirect') || code === 'NoSuchBucket' || msg.includes('NoSuchBucket')) {
      return "File storage service is temporarily unavailable due to a configuration issue. Please contact your system administrator.";
    }

    // 3. Access Denied / IAM Permissions
    if (msg.includes('not authorized to perform') || msg.includes('Access Denied') || code === 'AccessDenied') {
      return "Permission denied. You do not have permission to upload files to this storage location. Please contact your system administrator.";
    }

    // 4. File Too Large
    if (msg.includes('EntityTooLarge') || msg.includes('too large')) {
      return "The uploaded file exceeds the maximum allowed file size. Please choose a smaller file.";
    }

    return "Failed to upload file. Please check your network connection and try again.";
  }

  async ensureBucketExists(): Promise<void> {
    if (this.bucketChecked) return;

    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketChecked = true;
    } catch (headErr: any) {
      const msg = headErr?.message || '';
      const code = headErr?.code || headErr?.name || '';

      // If connection refused or reset, stop immediately and return clean error
      if (code === 'ECONNREFUSED' || msg.includes('ECONNREFUSED') || code === 'ECONNRESET' || msg.includes('ECONNRESET')) {
        throw new BadRequestException(this.formatStorageError(headErr));
      }

      try {
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created bucket "${this.bucket}" automatically.`);

        // Set public download policy for MinIO
        const publicPolicy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${this.bucket}/*`,
            },
          ],
        });
        await this.s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucket,
            Policy: publicPolicy,
          }),
        );
        this.logger.log(`Applied public-read policy on bucket "${this.bucket}".`);
      } catch (err: any) {
        this.logger.warn(`Notice while auto-creating bucket: ${err.message}`);
      }
      this.bucketChecked = true;
    }
  }

  buildPublicUrl(key: string): string {
    const cleanKey = key.replace(/^\/+/, '');
    if (this.publicUrl) {
      const base = this.publicUrl.replace(/\/+$/, '');
      return `${base}/${this.bucket}/${cleanKey}`;
    }
    if (this.endpoint) {
      const base = this.endpoint.replace(/\/+$/, '');
      return `${base}/${this.bucket}/${cleanKey}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${cleanKey}`;
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null;

    try {
      const parsed = new URL(url);
      const decodedPath = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');

      // Case 1: path begins with bucket name (path-style e.g. /rose-media/Rose/Reports/...)
      if (decodedPath.startsWith(`${this.bucket}/`)) {
        return decodedPath.substring(this.bucket.length + 1);
      }

      // Case 2: virtual-host style or CDN (host contains bucket, path is key)
      if (parsed.hostname.startsWith(`${this.bucket}.`) || parsed.hostname.includes('s3')) {
        return decodedPath;
      }

      // Case 3: matches Rose/ pattern
      const roseMatch = decodedPath.match(/(Rose\/.+)$/);
      if (roseMatch) {
        return roseMatch[1];
      }

      return decodedPath || null;
    } catch {
      return null;
    }
  }

  isManagedUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Check if URL contains S3 bucket name, endpoint, or amazonaws/minio indicators
    if (this.bucket && url.includes(this.bucket)) return true;
    if (this.endpoint && url.includes(new URL(this.endpoint).host)) return true;
    if (this.publicUrl && url.includes(new URL(this.publicUrl).host)) return true;
    if (url.includes('.amazonaws.com/')) return true;

    return false;
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'Rose/Reports',
  ): Promise<StorageUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    await this.ensureBucketExists();

    const safeFolder = folder.replace(/^\/+|\/+$/g, '');
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const cleanOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${safeFolder}/${timestamp}-${randomSuffix}-${cleanOriginalName}`;

    try {
      const parallelUpload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'application/octet-stream',
          ContentDisposition: 'inline',
        },
      });

      await parallelUpload.done();

      const publicUrl = this.buildPublicUrl(key);
      const ext = path.extname(file.originalname).replace(/^\./, '').toLowerCase();

      return {
        url: publicUrl,
        public_id: key,
        format: ext || file.mimetype.split('/')[1] || 'raw',
        bytes: file.size || file.buffer.length,
        originalName: file.originalname,
      };
    } catch (error: any) {
      const friendlyMessage = this.formatStorageError(error);
      this.logger.error(`S3/MinIO upload failed: ${friendlyMessage}`, error.stack);
      throw new BadRequestException(friendlyMessage);
    }
  }

  async deleteFile(key: string): Promise<{ success: boolean; result?: string }> {
    if (!key) {
      return { success: false, result: 'No key provided' };
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return { success: true, result: 'ok' };
    } catch (error: any) {
      const friendlyMessage = this.formatStorageError(error);
      this.logger.error(`Failed to delete object "${key}" from S3/MinIO: ${friendlyMessage}`);
      return { success: false, result: friendlyMessage };
    }
  }

  async deleteFileByUrl(url: string): Promise<{ success: boolean; result?: string }> {
    const key = this.extractKeyFromUrl(url);
    if (!key) {
      return { success: false, result: 'Not a recognized S3/MinIO URL' };
    }
    return this.deleteFile(key);
  }
}
