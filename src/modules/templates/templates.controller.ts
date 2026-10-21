import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateColumnDto } from './dto/create-column.dto';

@ApiTags('Templates')
@Controller('api/v1/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get full template tree (Sections -> Categories -> Groups -> Columns)' })
  async findAll(@Query('onlyLatest') onlyLatest?: string, @Query('versionGroupId') versionGroupId?: string) {
    const isLatest = onlyLatest === 'false' ? false : true;
    const templates = await this.templatesService.findAllTemplates({
      onlyLatest: isLatest,
      versionGroupId,
    });
    return { success: true, data: templates };
  }

  @Get('sections/:id/versions')
  @ApiOperation({ summary: 'Get all versions of a section group' })
  async getSectionVersions(@Param('id') id: string) {
    const section = await this.templatesService.findSectionById(id);
    const versionGroupId = section.versionGroupId || section.id;
    const versions = await this.templatesService.getSectionVersions(versionGroupId);
    return { success: true, data: versions };
  }

  @Post('sections/:id/publish-version')
  @ApiOperation({ summary: 'Publish new version of a section' })
  async createSectionVersion(@Param('id') id: string, @Body() dto: { changelog?: string }) {
    const section = await this.templatesService.createSectionVersion(id, dto);
    return { success: true, data: section, message: `Version ${section.version} created successfully` };
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create a new template section' })
  async createSection(@Body() dto: CreateSectionDto) {
    const section = await this.templatesService.createSection(dto);
    return { success: true, data: section };
  }

  @Put('sections/:id')
  @ApiOperation({ summary: 'Update a template section' })
  async updateSection(@Param('id') id: string, @Body() dto: any) {
    const section = await this.templatesService.updateSection(id, dto);
    return { success: true, data: section };
  }

  @Delete('sections/:id')
  async deleteSection(@Param('id') id: string) {
    await this.templatesService.deleteSection(id);
    return { success: true, message: 'Section deleted' };
  }

  @Post('sections/:sectionId/categories')
  @ApiOperation({ summary: 'Create category within section' })
  async createCategory(@Param('sectionId') sectionId: string, @Body() dto: CreateCategoryDto) {
    const category = await this.templatesService.createCategory(sectionId, dto);
    return { success: true, data: category };
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  async updateCategory(@Param('id') id: string, @Body() dto: any) {
    const category = await this.templatesService.updateCategory(id, dto);
    return { success: true, data: category };
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    await this.templatesService.deleteCategory(id);
    return { success: true, message: 'Category deleted' };
  }

  @Post('categories/:categoryId/groups')
  @ApiOperation({ summary: 'Create subcategory/group within category' })
  async createGroup(@Param('categoryId') categoryId: string, @Body() dto: CreateGroupDto) {
    const group = await this.templatesService.createGroup(categoryId, dto);
    return { success: true, data: group };
  }

  @Put('groups/:id')
  @ApiOperation({ summary: 'Update a subcategory/group' })
  async updateGroup(@Param('id') id: string, @Body() dto: any) {
    const group = await this.templatesService.updateGroup(id, dto);
    return { success: true, data: group };
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete a subcategory/group' })
  async deleteGroup(@Param('id') id: string) {
    await this.templatesService.deleteGroup(id);
    return { success: true, message: 'Group deleted' };
  }

  @Post('sections/:sectionId/columns')
  @ApiOperation({ summary: 'Create custom column within section' })
  async createSectionColumn(
    @Param('sectionId') sectionId: string,
    @Body() dto?: CreateColumnDto,
  ) {
    const column = await this.templatesService.createColumn(sectionId, null, dto);
    return { success: true, data: column };
  }

  @Post('categories/:categoryId/columns')
  @ApiOperation({ summary: 'Create custom column within category or group' })
  async createColumn(
    @Param('categoryId') categoryId: string,
    @Query('groupId') groupId?: string,
    @Body() dto?: CreateColumnDto,
  ) {
    const column = await this.templatesService.createColumn(categoryId, groupId, dto);
    return { success: true, data: column };
  }

  @Put('columns/:id')
  @ApiOperation({ summary: 'Update a column' })
  async updateColumn(@Param('id') id: string, @Body() dto: any) {
    const column = await this.templatesService.updateColumn(id, dto);
    return { success: true, data: column };
  }

  @Delete('columns/:id')
  async deleteColumn(@Param('id') id: string) {
    await this.templatesService.deleteColumn(id);
    return { success: true, message: 'Column deleted' };
  }
}
