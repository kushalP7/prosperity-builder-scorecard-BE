import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LandingProjectsService } from '../services/landing-projects.service';
import { CreateLandingProjectDto } from '../dto/create-landing-project.dto';
import { UpdateLandingProjectDto } from '../dto/update-landing-project.dto';

@ApiTags('Landing CMS Projects')
@Controller('landing-cms/projects')
export class LandingProjectsController {
  constructor(private readonly projectsService: LandingProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all landing portfolio projects' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
  ) {
    const featuredOnly = featured === 'true' ? true : featured === 'false' ? false : undefined;
    return this.projectsService.findAll({
      category,
      status,
      featured: featuredOnly,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get landing project by ID' })
  async findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new landing portfolio project' })
  async create(@Body() dto: CreateLandingProjectDto) {
    return this.projectsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing landing portfolio project' })
  async update(@Param('id') id: string, @Body() dto: UpdateLandingProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a landing portfolio project' })
  async delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }
}
