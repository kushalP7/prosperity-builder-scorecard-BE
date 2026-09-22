import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Project } from './entities/project.entity';
import { ProjectDataRecord } from './entities/project-data-record.entity';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { TemplateCategory } from '../templates/entities/template-category.entity';
import { TemplateGroup } from '../templates/entities/template-group.entity';
import { TemplateColumn } from '../templates/entities/template-column.entity';
import { ConditionalRule } from '../templates/entities/conditional-rule.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DataUpdateItemDto } from './dto/update-project-data.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectDataRecord) private recordModel: typeof ProjectDataRecord,
    @InjectModel(TemplateSection) private templateSectionModel: typeof TemplateSection,
    private sequelize: Sequelize,
  ) {}

  private formatProject(project: Project): any {
    const json = project.toJSON() as any;
    const dataMap: Record<string, Record<string, any>> = {};

    if (project.records) {
      for (const rec of project.records) {
        if (!dataMap[rec.nodeId]) {
          dataMap[rec.nodeId] = {};
        }
        dataMap[rec.nodeId][rec.columnId] = {
          value: rec.value,
          source: rec.source,
          notes: rec.notes,
          scoreValue: rec.scoreValue,
        };
      }
    }

    json.data = dataMap;
    json.assignedSections = json.assignedSections || [];
    json.enabledWidgets = json.enabledWidgets || [];
    return json;
  }

  async findAll(search?: string): Promise<any[]> {
    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    const projects = await this.projectModel.findAll({
      where,
      include: [{ model: ProjectDataRecord, as: 'records', separate: true }],
      order: [['updatedAt', 'DESC']],
    });

    return projects.map((p) => this.formatProject(p));
  }

  async create(dto: CreateProjectDto): Promise<any> {
    const project = await this.projectModel.create({
      ...dto,
      assignedSections: [],
      enabledWidgets: [],
    } as any);
    return this.findOne(project.id);
  }

  async findOne(id: string): Promise<any> {
    const project = await this.projectModel.findByPk(id, {
      include: [{ model: ProjectDataRecord, as: 'records', separate: true }],
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return this.formatProject(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<any> {
    const projectModel = await this.projectModel.findByPk(id);
    if (!projectModel) throw new NotFoundException(`Project with ID ${id} not found`);
    await projectModel.update(dto);
    return this.findOne(id);
  }

  async assignSection(projectId: string, sectionId: string): Promise<any> {
    const projectModel = await this.projectModel.findByPk(projectId);
    if (!projectModel) throw new NotFoundException(`Project ${projectId} not found`);

    const sectionTemplate = await this.templateSectionModel.findByPk(sectionId, {
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
                  include: [{ model: ConditionalRule, as: 'conditionalRules' }],
                },
              ],
            },
            {
              model: TemplateColumn,
              as: 'columns',
              include: [{ model: ConditionalRule, as: 'conditionalRules' }],
            },
          ],
        },
      ],
    });

    if (!sectionTemplate) throw new NotFoundException(`Template section ${sectionId} not found`);

    const clonedSection = JSON.parse(JSON.stringify(sectionTemplate.toJSON()));
    const assignedSections = [...(projectModel.assignedSections || []), clonedSection];

    await projectModel.update({ assignedSections });
    return this.findOne(projectId);
  }

  async updateData(projectId: string, updates: DataUpdateItemDto[]): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      for (const update of updates) {
        await this.recordModel.upsert(
          {
            projectId,
            nodeId: update.nodeId,
            columnId: update.columnId,
            value: update.data.value,
            source: update.data.source,
            notes: update.data.notes,
            scoreValue: update.data.scoreValue,
          },
          { transaction },
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const projectModel = await this.projectModel.findByPk(id);
    if (projectModel) {
      await projectModel.destroy();
    }
  }
}
