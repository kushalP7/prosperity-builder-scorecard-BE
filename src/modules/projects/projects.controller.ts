import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, AssignSectionDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectDataDto } from './dto/update-project-data.dto';

@ApiTags('Projects')
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects list' })
  async findAll(@Query('search') search?: string) {
    const projects = await this.projectsService.findAll(search);
    return { success: true, data: projects };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(@Body() dto: CreateProjectDto) {
    const project = await this.projectsService.create(dto);
    return { success: true, data: project };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID with assigned sections and data matrix' })
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(id);
    return { success: true, data: project };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project settings or layout' })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const project = await this.projectsService.update(id, dto);
    return { success: true, data: project };
  }

  @Post(':id/sections')
  @ApiOperation({ summary: 'Assign template section snapshot to project' })
  async assignSection(@Param('id') id: string, @Body() dto: AssignSectionDto) {
    const project = await this.projectsService.assignSection(id, dto.sectionId);
    return { success: true, data: project };
  }

  @Patch(':id/data')
  @ApiOperation({ summary: 'Batch update data records for a project matrix' })
  async updateData(@Param('id') id: string, @Body() dto: UpdateProjectDataDto) {
    await this.projectsService.updateData(id, dto.updates);
    return { success: true, message: 'Project data updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete project' })
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
  }
}
