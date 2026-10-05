import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { S3StorageProvider } from './providers/s3.provider';
import { CloudinaryStorageProvider } from './providers/cloudinary.provider';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  controllers: [UploadsController],
  providers: [
    CloudinaryProvider,
    CloudinaryStorageProvider,
    S3StorageProvider,
    UploadsService,
  ],
  exports: [UploadsService, S3StorageProvider, CloudinaryStorageProvider],
})
export class UploadsModule {}
