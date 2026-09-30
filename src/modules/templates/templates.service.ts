import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TemplateSection } from './entities/template-section.entity';
import { TemplateCategory } from './entities/template-category.entity';
import { TemplateGroup } from './entities/template-group.entity';
import { TemplateColumn } from './entities/template-column.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(TemplateSection) private sectionModel: typeof TemplateSection,
    @InjectModel(TemplateCategory) private categoryModel: typeof TemplateCategory,
    @InjectModel(TemplateGroup) private groupModel: typeof TemplateGroup,
    @InjectModel(TemplateColumn) private columnModel: typeof TemplateColumn,
  ) {}

  async findAllTemplates(): Promise<TemplateSection[]> {
    return this.sectionModel.findAll({
      include: [
        {
          model: TemplateCategory,
          as: 'categories',
          include: [
            {
              model: TemplateGroup,
              as: 'groups',
              include: [
                {
                  model: TemplateColumn,
                  as: 'columns',
                },
              ],
            },
            {
              model: TemplateColumn,
              as: 'columns',
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async createSection(dto: any): Promise<TemplateSection> {
    return this.sectionModel.create(dto);
  }

  async createCategory(sectionId: string, dto: any): Promise<TemplateCategory> {
    const section = await this.sectionModel.findByPk(sectionId);
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
    return this.categoryModel.create({ ...dto, sectionId });
  }

  async createGroup(categoryId: string, dto: any): Promise<TemplateGroup> {
    const category = await this.categoryModel.findByPk(categoryId);
    if (!category) throw new NotFoundException(`Category ${categoryId} not found`);
    return this.groupModel.create({ ...dto, categoryId });
  }

  async createColumn(categoryId: string, groupId: string | null, dto: any): Promise<TemplateColumn> {
    const { conditionalRules, ...colData } = dto;
    const column = await this.columnModel.create({
      ...colData,
      categoryId,
      groupId: groupId || null,
    });

    return this.columnModel.findByPk(column.id);
  }

  async deleteSection(id: string): Promise<void> {
    const section = await this.sectionModel.findByPk(id);
    if (section) await section.destroy();
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryModel.findByPk(id);
    if (category) await category.destroy();
  }

  async deleteColumn(id: string): Promise<void> {
    const column = await this.columnModel.findByPk(id);
    if (column) await column.destroy();
  }
}
