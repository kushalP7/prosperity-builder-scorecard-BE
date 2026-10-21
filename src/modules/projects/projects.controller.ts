import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, AssignSectionDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectDataDto } from './dto/update-project-data.dto';

@ApiTags('Projects')
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all projects list with optional search and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.projectsService.findAll({
      search,
      page: page !== undefined && page !== '' ? parseInt(page, 10) : undefined,
      limit: limit !== undefined && limit !== '' ? parseInt(limit, 10) : undefined,
    });
    return { success: true, data: result };
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
  @ApiOperation({ summary: 'Assign template section snapshot(s) to project' })
  async assignSection(@Param('id') id: string, @Body() dto: AssignSectionDto) {
    const sectionIds: string[] = dto.sectionIds && dto.sectionIds.length > 0
      ? dto.sectionIds
      : (dto.sectionId ? [dto.sectionId] : []);
    const project = await this.projectsService.assignSections(id, sectionIds);
    return { success: true, data: project };
  }

  @Patch(':id/data')
  @ApiOperation({ summary: 'Batch update data records for a project matrix' })
  async updateData(@Param('id') id: string, @Body() dto: UpdateProjectDataDto) {
    await this.projectsService.updateData(id, dto.updates);
    return { success: true, message: 'Project data updated successfully' };
  }

  @Post(':id/recalculate')
  @ApiOperation({ summary: 'Recalculate project scorecard and return fresh project data' })
  async recalculate(@Param('id') id: string) {
    const project = await this.projectsService.recalculate(id);
    return { success: true, data: project, message: 'Project scorecard recalculated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete project' })
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
    return { success: true, message: 'Project soft-deleted successfully' };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted project' })
  async restore(@Param('id') id: string) {
    const project = await this.projectsService.restore(id);
    return { success: true, data: project, message: 'Project restored successfully' };
  }
}
