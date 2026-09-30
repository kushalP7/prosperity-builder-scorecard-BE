import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LandingMediaService } from '../services/landing-media.service';
import { CreateLandingMediaDto } from '../dto/create-landing-media.dto';
import { UpdateLandingMediaDto } from '../dto/update-landing-media.dto';

@ApiTags('Landing CMS Media')
@Controller(['api/v1/landing-cms/media', 'landing-cms/media'])
export class LandingMediaController {
  constructor(private readonly mediaService: LandingMediaService) { }

  @Get()
  @ApiOperation({ summary: 'Get all media sphere items' })
  @ApiQuery({ name: 'mediaType', required: false, description: 'Filter by media type (video, audio, document)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  async findAll(@Query('mediaType') mediaType?: string, @Query('category') category?: string, @Query('status') status?: string, @Query('featured') featured?: string, @Query('search') search?: string) {
    const featuredOnly = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.mediaService.findAll({ mediaType, category, status, featured: featuredOnly, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media item by ID' })
  async findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new media sphere item' })
  async create(@Body() dto: CreateLandingMediaDto) {
    return this.mediaService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing media sphere item' })
  async update(@Param('id') id: string, @Body() dto: UpdateLandingMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media sphere item' })
  async remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
