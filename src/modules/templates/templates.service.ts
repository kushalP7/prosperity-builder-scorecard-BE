import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TemplateSection } from './entities/template-section.entity';
import { TemplateCategory } from './entities/template-category.entity';
import { TemplateGroup } from './entities/template-group.entity';
import { TemplateColumn, ColumnType } from './entities/template-column.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(TemplateSection) private sectionModel: typeof TemplateSection,
    @InjectModel(TemplateCategory) private categoryModel: typeof TemplateCategory,
    @InjectModel(TemplateGroup) private groupModel: typeof TemplateGroup,
    @InjectModel(TemplateColumn) private columnModel: typeof TemplateColumn,
    private readonly sequelize: Sequelize,
  ) {}

  async findAllTemplates(query?: { onlyLatest?: boolean; versionGroupId?: string }): Promise<TemplateSection[]> {
    const where: any = {};
    if (query?.onlyLatest !== false) {
      where.isLatest = true;
    }
    if (query?.versionGroupId) {
      where.versionGroupId = query.versionGroupId;
    }

    return this.sectionModel.findAll({
      where,
      include: [
        {
          model: TemplateColumn,
          as: 'columns',
        },
        {
          model: TemplateCategory,
          as: 'categories',
          include: [
            {
              model: TemplateGroup,
              as: 'groups',
            },
          ],
        },
      ],
      order: [
        ['createdAt', 'ASC'],
        [{ model: TemplateColumn, as: 'columns' }, 'createdAt', 'ASC'],
        [{ model: TemplateCategory, as: 'categories' }, 'createdAt', 'ASC'],
        [{ model: TemplateCategory, as: 'categories' }, { model: TemplateGroup, as: 'groups' }, 'createdAt', 'ASC'],
      ],
    });
  }

  async findSectionById(id: string): Promise<TemplateSection> {
    const section = await this.sectionModel.findByPk(id, {
      include: [
        {
          model: TemplateColumn,
          as: 'columns',
        },
        {
          model: TemplateCategory,
          as: 'categories',
          include: [
            {
              model: TemplateGroup,
              as: 'groups',
            },
          ],
        },
      ],
    });
    if (!section) throw new NotFoundException(`Section ${id} not found`);
    return section;
  }

  async createDefaultColumnsForSection(sectionId: string, transaction?: any): Promise<TemplateColumn[]> {
    const existingCount = await this.columnModel.count({ where: { sectionId }, transaction });
    if (existingCount > 0) return [];

    return this.columnModel.bulkCreate(
      [
        {
          sectionId,
          name: 'Y(1)/N(0)',
          type: ColumnType.NUMBER,
          weight: 1,
          validationMin: 0,
          validationMax: 1,
          scoringRule: { kind: 'manual', maxPoints: 1 },
        },
        {
          sectionId,
          name: 'Weight (1-4)',
          type: ColumnType.NUMBER,
          weight: 1,
          validationMin: 1,
          validationMax: 4,
          scoringRule: { kind: 'manual', maxPoints: 4 },
        },
        {
          sectionId,
          name: 'Value',
          type: ColumnType.NUMBER,
          weight: 1,
          validationMin: 0,
          validationMax: 10,
          scoringRule: { kind: 'manual', maxPoints: 10 },
        },
        {
          sectionId,
          name: 'Client Total Score',
          type: ColumnType.FORMULA,
          formulaExpression: 'Weight_1_4_ * Value',
          weight: 1,
          isReadOnly: true,
          validationMin: 0,
          validationMax: 100,
          scoringRule: { kind: 'manual', maxPoints: 10 },
        },
        {
          sectionId,
          name: 'Highest Score',
          type: ColumnType.NUMBER,
          weight: 1,
          validationMin: 0,
          validationMax: 100,
          scoringRule: { kind: 'manual', maxPoints: 10 },
        },
        {
          sectionId,
          name: 'Local Data Result & Notes',
          type: ColumnType.TEXT,
          weight: 1,
          validationMin: null,
          validationMax: null,
          scoringRule: { kind: 'manual', maxPoints: 0 },
        },
      ],
      { transaction },
    );
  }

  async getSectionVersions(versionGroupId: string): Promise<any[]> {
    const versions = await this.sectionModel.findAll({
      where: { versionGroupId },
      include: [
        {
          model: TemplateColumn,
          as: 'columns',
        },
        {
          model: TemplateCategory,
          as: 'categories',
          include: [
            {
              model: TemplateGroup,
              as: 'groups',
            },
          ],
        },
      ],
      order: [['version', 'DESC']],
    });

    return versions.map((v) => {
      const data = v.toJSON();
      if (data.snapshot) {
        if (data.snapshot.categories) data.categories = data.snapshot.categories;
        if (data.snapshot.columns) data.columns = data.snapshot.columns;
      }
      return data;
    });
  }

  async createSection(dto: any): Promise<TemplateSection> {
    const section = await this.sectionModel.create({
      ...dto,
      version: 1,
      isLatest: true,
      status: 'active',
    });
    if (!section.versionGroupId) {
      await section.update({ versionGroupId: section.id });
    }
    // Automatically seed the 7 default scorecard columns for this new section
    await this.createDefaultColumnsForSection(section.id);
    return this.findSectionById(section.id);
  }

  async createSectionVersion(sectionId: string, dto?: { changelog?: string }): Promise<TemplateSection> {
    const sourceSection = await this.sectionModel.findByPk(sectionId, {
      include: [
        {
          model: TemplateColumn,
          as: 'columns',
        },
        {
          model: TemplateCategory,
          as: 'categories',
          include: [
            {
              model: TemplateGroup,
              as: 'groups',
            },
          ],
        },
      ],
    });

    if (!sourceSection) {
      throw new NotFoundException(`Section ${sectionId} not found`);
    }

    const versionGroupId = sourceSection.versionGroupId || sourceSection.id;
    const currentMaxVersion =
      ((await this.sectionModel.max('version', { where: { versionGroupId } })) as number) ||
      sourceSection.version ||
      1;
    const newVersion = currentMaxVersion + 1;

    // Capture current working state to become the snapshot of the new version
    const newSnapshot = {
      categories: (sourceSection.categories || []).map((cat) => ({
        ...cat.toJSON(),
        groups: ((cat as any).groups || []).map((grp: any) => grp.toJSON()),
      })),
      columns: (sourceSection.columns || []).map((col) => col.toJSON()),
    };

    const transaction = await this.sequelize.transaction();
    try {
      // 1. Mark existing versions in this group as not latest and archived
      await this.sectionModel.update(
        { isLatest: false, status: 'archived' },
        { where: { versionGroupId }, transaction },
      );

      // If sourceSection doesn't have a snapshot, initialize it before archiving
      if (!sourceSection.snapshot) {
        await sourceSection.update({ snapshot: newSnapshot }, { transaction });
      }

      // 2. Create the new section version
      const newSection = await this.sectionModel.create(
        {
          label: sourceSection.label,
          description: sourceSection.description,
          accentColor: sourceSection.accentColor,
          icon: sourceSection.icon,
          version: newVersion,
          isLatest: true,
          status: 'active',
          versionGroupId,
          changelog: dto?.changelog || `Version ${newVersion} created`,
          snapshot: newSnapshot,
        },
        { transaction },
      );

      // 3. Clone columns for this section
      for (const col of sourceSection.columns || []) {
        const colData = col.toJSON();
        delete colData.id;
        delete colData.createdAt;
        delete colData.updatedAt;
        colData.sectionId = newSection.id;
        await this.columnModel.create(colData, { transaction });
      }

      // 4. Clone categories and groups
      for (const cat of sourceSection.categories || []) {
        const catData = cat.toJSON();
        delete catData.id;
        delete catData.createdAt;
        delete catData.updatedAt;
        catData.sectionId = newSection.id;

        const newCat = await this.categoryModel.create(catData, { transaction });

        for (const grp of cat.groups || []) {
          const grpData = grp.toJSON();
          delete grpData.id;
          delete grpData.createdAt;
          delete grpData.updatedAt;
          grpData.categoryId = newCat.id;

          await this.groupModel.create(grpData, { transaction });
        }
      }

      await transaction.commit();

      // Return the new complete section
      const result = await this.sectionModel.findByPk(newSection.id, {
        include: [
          { model: TemplateColumn, as: 'columns' },
          { model: TemplateCategory, as: 'categories', include: [{ model: TemplateGroup, as: 'groups' }] },
        ],
      });
      return result!;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async updateSection(id: string, dto: any): Promise<TemplateSection> {
    const section = await this.sectionModel.findByPk(id);
    if (!section) throw new NotFoundException(`Section ${id} not found`);
    await section.update(dto);
    return section;
  }

  async createCategory(sectionId: string, dto: any): Promise<TemplateCategory> {
    const section = await this.sectionModel.findByPk(sectionId);
    if (!section) throw new NotFoundException(`Section ${sectionId} not found`);
    // Ensure default columns exist on the section
    await this.createDefaultColumnsForSection(sectionId);
    return this.categoryModel.create({ ...dto, sectionId });
  }

  async updateCategory(id: string, dto: any): Promise<TemplateCategory> {
    const category = await this.categoryModel.findByPk(id);
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    await category.update(dto);
    return category;
  }

  async createGroup(categoryId: string, dto: any): Promise<TemplateGroup> {
    const category = await this.categoryModel.findByPk(categoryId);
    if (!category) throw new NotFoundException(`Category ${categoryId} not found`);
    return this.groupModel.create({ ...dto, categoryId });
  }

  async updateGroup(id: string, dto: any): Promise<TemplateGroup> {
    const group = await this.groupModel.findByPk(id);
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    await group.update(dto);
    return group;
  }

  async createColumn(targetId: string, groupId: string | null, dto: any): Promise<TemplateColumn> {
    const { conditionalRules, validation, ...colData } = dto;
    if (validation) {
      if (validation.min !== undefined && validation.min !== null) colData.validationMin = validation.min;
      if (validation.max !== undefined && validation.max !== null) colData.validationMax = validation.max;
    }

    // Determine sectionId: check if targetId is a Section or a Category
    let sectionId = targetId;
    const cat = await this.categoryModel.findByPk(targetId);
    if (cat) {
      sectionId = cat.sectionId;
    }

    const column = await this.columnModel.create({
      ...colData,
      sectionId,
    });

    return this.columnModel.findByPk(column.id);
  }

  async updateColumn(id: string, dto: any): Promise<TemplateColumn> {
    const column = await this.columnModel.findByPk(id);
    if (!column) throw new NotFoundException(`Column ${id} not found`);

    const oldName = column.name;
    const { conditionalRules, validation, ...colData } = dto;
    if (validation) {
      if (validation.min !== undefined) colData.validationMin = validation.min;
      if (validation.max !== undefined) colData.validationMax = validation.max;
    }
    await column.update(colData);

    // If column name changed, cascade update to any formula expressions in the same section
    if (colData.name && oldName && oldName !== colData.name) {
      const oldSafeName = oldName.replace(/[^a-zA-Z0-9_]/g, '_');
      const newSafeName = colData.name.replace(/[^a-zA-Z0-9_]/g, '_');
      if (oldSafeName !== newSafeName) {
        const escapedOld = oldSafeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedOld}\\b`, 'g');

        const siblingColumns = await this.columnModel.findAll({
          where: {
            sectionId: column.sectionId,
            type: ColumnType.FORMULA,
          },
        });

        for (const sib of siblingColumns) {
          if (sib.id !== column.id && sib.formulaExpression && regex.test(sib.formulaExpression)) {
            const updatedExpr = sib.formulaExpression.replace(regex, newSafeName);
            await sib.update({ formulaExpression: updatedExpr });
          }
        }
      }
    }

    return column;
  }

  async deleteSection(id: string): Promise<void> {
    const section = await this.sectionModel.findByPk(id);
    if (section) await section.destroy();
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryModel.findByPk(id);
    if (category) await category.destroy();
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.groupModel.findByPk(id);
    if (group) await group.destroy();
  }

  async deleteColumn(id: string): Promise<void> {
    const column = await this.columnModel.findByPk(id);
    if (column) await column.destroy();
  }
}
