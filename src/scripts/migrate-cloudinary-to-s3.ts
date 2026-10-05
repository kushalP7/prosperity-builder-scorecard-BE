import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import { AppModule } from '../app.module';
import { S3StorageProvider } from '../modules/uploads/providers/s3.provider';
import { LandingProject } from '../modules/landing-cms/entities/landing-project.entity';
import { LandingMedia } from '../modules/landing-cms/entities/landing-media.entity';
import { LandingReport } from '../modules/landing-cms/entities/landing-report.entity';

async function runMigration() {
  const logger = new Logger('MigrateCloudinaryToS3');
  logger.log('Starting migration from Cloudinary to S3/MinIO...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const s3Provider = app.get(S3StorageProvider);

  const urlCache = new Map<string, string>();

  async function migrateUrl(url?: string | null, targetFolder: string = 'Rose/Reports'): Promise<string | null> {
    if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
      return url || null;
    }

    if (urlCache.has(url)) {
      return urlCache.get(url)!;
    }

    try {
      logger.log(`Downloading: ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        logger.warn(`Failed to fetch ${url} (HTTP ${res.status}). Skipping.`);
        return url;
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const parsed = new URL(url);
      const originalName = path.basename(parsed.pathname) || 'asset';
      const contentType = res.headers.get('content-type') || 'application/octet-stream';

      const multerFile: Express.Multer.File = {
        buffer,
        originalname: originalName,
        mimetype: contentType,
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
        destination: '',
        filename: originalName,
        path: '',
        stream: null as any,
      };

      const uploadResult = await s3Provider.uploadFile(multerFile, targetFolder);
      logger.log(`Uploaded to S3/MinIO: ${uploadResult.url}`);

      urlCache.set(url, uploadResult.url);
      return uploadResult.url;
    } catch (err: any) {
      logger.error(`Error migrating ${url}: ${err.message}`);
      return url;
    }
  }

  // 1. Migrate Landing Projects
  logger.log('Migrating Landing Projects...');
  const projects = await LandingProject.findAll();
  for (const project of projects) {
    if (project.pdfUrl && project.pdfUrl.includes('res.cloudinary.com')) {
      const newPdfUrl = await migrateUrl(project.pdfUrl, 'Rose/Project_Partners');
      if (newPdfUrl && newPdfUrl !== project.pdfUrl) {
        await project.update({ pdfUrl: newPdfUrl });
        logger.log(`Updated Project "${project.title}" (${project.id}) with new PDF URL`);
      }
    }
  }

  // 2. Migrate Landing Media
  logger.log('Migrating Landing Media...');
  const mediaList = await LandingMedia.findAll();
  for (const media of mediaList) {
    if (media.sourceUrl && media.sourceUrl.includes('res.cloudinary.com')) {
      let folder = 'Rose/Media';
      if (media.mediaType === 'audio') folder = 'Rose/Media/Audio';
      if (media.mediaType === 'video') folder = 'Rose/Media/Video';
      if (media.mediaType === 'document') folder = 'Rose/Media/PDF';

      const newUrl = await migrateUrl(media.sourceUrl, folder);
      if (newUrl && newUrl !== media.sourceUrl) {
        await media.update({ sourceUrl: newUrl });
        logger.log(`Updated Media "${media.title}" (${media.id}) with new URL`);
      }
    }
  }

  // 3. Migrate Landing Reports
  logger.log('Migrating Landing Reports...');
  const reports = await LandingReport.findAll();
  for (const report of reports) {
    let reportUpdated = false;
    let coverImage = report.coverImage;
    let pdfUrl = report.pdfUrl;

    if (coverImage && coverImage.includes('res.cloudinary.com')) {
      const newCover = await migrateUrl(coverImage, 'Rose/Reports');
      if (newCover && newCover !== coverImage) {
        coverImage = newCover;
        reportUpdated = true;
      }
    }

    if (pdfUrl && pdfUrl.includes('res.cloudinary.com')) {
      const newPdf = await migrateUrl(pdfUrl, 'Rose/Reports');
      if (newPdf && newPdf !== pdfUrl) {
        pdfUrl = newPdf;
        reportUpdated = true;
      }
    }

    // Traverse blocks JSON
    let blocks = report.blocks;
    if (Array.isArray(blocks)) {
      blocks = JSON.parse(JSON.stringify(blocks)); // clone
      for (const block of blocks as any[]) {
        if (block?.pdfUrl && typeof block.pdfUrl === 'string' && block.pdfUrl.includes('res.cloudinary.com')) {
          block.pdfUrl = await migrateUrl(block.pdfUrl, 'Rose/Reports');
          reportUpdated = true;
        }

        if (Array.isArray(block?.images)) {
          for (const img of block.images) {
            if (img?.url && typeof img.url === 'string' && img.url.includes('res.cloudinary.com')) {
              img.url = await migrateUrl(img.url, 'Rose/Reports');
              reportUpdated = true;
            }
          }
        }

        if (Array.isArray(block?.files)) {
          for (const f of block.files) {
            if (f?.url && typeof f.url === 'string' && f.url.includes('res.cloudinary.com')) {
              f.url = await migrateUrl(f.url, 'Rose/Reports');
              reportUpdated = true;
            }
          }
        }

        if (Array.isArray(block?.items)) {
          for (const item of block.items) {
            if (item?.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.includes('res.cloudinary.com')) {
              item.imageUrl = await migrateUrl(item.imageUrl, 'Rose/Reports');
              reportUpdated = true;
            }
          }
        }
      }
    }

    if (reportUpdated) {
      await report.update({
        coverImage,
        pdfUrl,
        blocks,
      });
      logger.log(`Updated Report "${report.title}" (${report.id})`);
    }
  }

  logger.log(`Migration complete! Migrated ${urlCache.size} unique Cloudinary assets to S3/MinIO.`);
  await app.close();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
