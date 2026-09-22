import { Controller, Post, Delete, UseInterceptors, UploadedFile, BadRequestException, Query, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { ApiTags, ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('image')
  @ApiOperation({ summary: 'Upload an image file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder (reports, media, projects)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Query('folder') folderQuery?: string, @Body('folder') folderBody?: string) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }
    const targetFolder = this.uploadsService.resolveFolderPath(folderQuery || folderBody || 'reports');
    return this.uploadsService.uploadFile(file, targetFolder, 'image');
  }

  @Post('file')
  @ApiOperation({ summary: 'Upload a document or PDF file to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Target folder (reports, media, projects)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Query('folder') folderQuery?: string, @Body('folder') folderBody?: string) {
    if (!file) {
      throw new BadRequestException('No document file provided');
    }
    const targetFolder = this.uploadsService.resolveFolderPath(folderQuery || folderBody || 'pdf');
    return this.uploadsService.uploadFile(file, targetFolder, 'auto');
  }

  @Post('media')
  @ApiOperation({ summary: 'Upload media (video, audio, or PDF) to Cloudinary under Rose/Media/' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Target subfolder (audio, video, pdf)' })
  @ApiQuery({ name: 'type', required: false, description: 'Media type (audio, video, pdf)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File, @Query('folder') folderQuery?: string, @Body('folder') folderBody?: string, @Query('type') typeQuery?: string, @Body('type') typeBody?: string) {
    if (!file) {
      throw new BadRequestException('No media file provided');
    }
    const mediaType = (typeQuery || typeBody || folderQuery || folderBody || 'media').toLowerCase();
    const targetFolder = this.uploadsService.resolveFolderPath(mediaType);

    let resourceType: 'auto' | 'video' | 'image' | 'raw' = 'auto';
    if (mediaType.includes('video') || mediaType.includes('audio') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      resourceType = 'video';
    }

    return this.uploadsService.uploadFile(file, targetFolder, resourceType);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a file from Cloudinary by publicId or URL' })
  async deleteFile(@Body('publicId') publicId?: string, @Body('url') url?: string, @Body('resourceType') resourceType?: 'image' | 'raw' | 'video' | 'auto', @Query('url') queryUrl?: string,) {
    const targetUrl = url || queryUrl;
    if (targetUrl) {
      return this.uploadsService.deleteFileByUrl(targetUrl);
    }
    if (publicId) {
      return this.uploadsService.deleteFile(publicId, resourceType || 'auto');
    }
    throw new BadRequestException('Must provide publicId or url to delete');
  }
}
