import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { S3StorageProvider } from './providers/s3.provider';

@Module({
  controllers: [UploadsController],
  providers: [S3StorageProvider, UploadsService],
  exports: [UploadsService, S3StorageProvider],
})
export class UploadsModule {}
