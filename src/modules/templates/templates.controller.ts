import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
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
  async findAll() {
    const templates = await this.templatesService.findAllTemplates();
    return { success: true, data: templates };
  }

  @Post('sections')
  @ApiOperation({ summary: 'Create a new template section' })
  async createSection(@Body() dto: CreateSectionDto) {
    const section = await this.templatesService.createSection(dto);
    return { success: true, data: section };
  }

  @Post('sections/:sectionId/categories')
  @ApiOperation({ summary: 'Create category within section' })
  async createCategory(@Param('sectionId') sectionId: string, @Body() dto: CreateCategoryDto) {
    const category = await this.templatesService.createCategory(sectionId, dto);
    return { success: true, data: category };
  }

  @Post('categories/:categoryId/groups')
  @ApiOperation({ summary: 'Create subcategory/group within category' })
  async createGroup(@Param('categoryId') categoryId: string, @Body() dto: CreateGroupDto) {
    const group = await this.templatesService.createGroup(categoryId, dto);
    return { success: true, data: group };
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

  @Delete('sections/:id')
  async deleteSection(@Param('id') id: string) {
    await this.templatesService.deleteSection(id);
    return { success: true, message: 'Section deleted' };
  }

  @Delete('columns/:id')
  async deleteColumn(@Param('id') id: string) {
    await this.templatesService.deleteColumn(id);
    return { success: true, message: 'Column deleted' };
  }
}
