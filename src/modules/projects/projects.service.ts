import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { Project, ProjectStatus } from './entities/project.entity';
import { ProjectDataRecord } from './entities/project-data-record.entity';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { TemplateCategory } from '../templates/entities/template-category.entity';
import { TemplateGroup } from '../templates/entities/template-group.entity';
import { TemplateColumn } from '../templates/entities/template-column.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DataUpdateItemDto } from './dto/update-project-data.dto';

import { Inject, forwardRef } from '@nestjs/common';
import { ScorecardCalcService } from '../engine/scorecard-calc.service';
import { ScorecardRollup } from '../engine/entities/scorecard-rollup.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectDataRecord) private recordModel: typeof ProjectDataRecord,
    @InjectModel(TemplateSection) private templateSectionModel: typeof TemplateSection,
    private sequelize: Sequelize,
    @Inject(forwardRef(() => ScorecardCalcService))
    private scorecardCalcService: ScorecardCalcService,
  ) { }

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
    json.rollup = project.rollup ? (typeof (project.rollup as any).toJSON === 'function' ? (project.rollup as any).toJSON() : project.rollup) : null;
    return json;
  }

  private formatProjectSummary(project: Project): any {
    const json = project.toJSON() as any;
    delete json.records;
    delete json.dashboardLayout;

    // Send only lightweight assigned sections summary (id, label, name, icon, accentColor) without heavy nested categories & columns
    const rawSections = Array.isArray(json.assignedSections) ? json.assignedSections : [];
    json.assignedSections = rawSections.map((s: any) => ({
      id: s.id,
      label: s.label || s.name || '',
      name: s.label || s.name || '',
      accentColor: s.accentColor || '#B5111B',
      icon: s.icon || 'Layers',
    }));

    json.data = {};
    json.enabledWidgets = json.enabledWidgets || [];
    json.rollup = project.rollup ? (typeof (project.rollup as any).toJSON === 'function' ? (project.rollup as any).toJSON() : project.rollup) : null;
    return json;
  }

  async findAll(options?: { search?: string; page?: number; limit?: number } | string): Promise<any> {
    let search: string | undefined;
    let page: number | undefined;
    let limit: number | undefined;

    if (typeof options === 'object' && options !== null) {
      search = options.search;
      page = options.page;
      limit = options.limit;
    } else if (typeof options === 'string') {
      search = options;
    }

    const where: any = {
      deleted: { [Op.ne]: true },
    };
    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: s } },
        { clientName: { [Op.iLike]: s } },
        { county: { [Op.iLike]: s } },
        { state: { [Op.iLike]: s } },
      ];
    }

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 9);
      const offset = (pageNum - 1) * limitNum;

      const { rows, count } = await this.projectModel.findAndCountAll({
        where,
        include: [
          { model: ScorecardRollup, as: 'rollup' },
        ],
        order: [['createdAt', 'DESC'], ['id', 'DESC']],
        limit: limitNum,
        offset,
        distinct: true,
      });

      return {
        data: rows.map((p) => this.formatProjectSummary(p)),
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1,
      };
    }

    const projects = await this.projectModel.findAll({
      where,
      include: [
        { model: ScorecardRollup, as: 'rollup' },
      ],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
    });

    return projects.map((p) => this.formatProjectSummary(p));
  }

  async create(dto: CreateProjectDto): Promise<any> {
    const project = await this.projectModel.create({
      ...dto,
      assignedSections: [],
      enabledWidgets: [],
      deleted: false,
      deletedAt: null,
    } as any);
    await this.scorecardCalcService.calculateAllRowsForProject(project.id).catch((err) => {
      console.error('Error calculating scorecard for new project:', err);
    });
    return this.findOne(project.id);
  }

  async findOne(id: string): Promise<any> {
    const project = await this.projectModel.findOne({
      where: {
        id,
        deleted: { [Op.ne]: true },
      },
      include: [
        { model: ProjectDataRecord, as: 'records', separate: true },
        { model: ScorecardRollup, as: 'rollup' },
      ],
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    return this.formatProject(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<any> {
    const projectModel = await this.projectModel.findByPk(id);
    if (!projectModel) throw new NotFoundException(`Project with ID ${id} not found`);
    await projectModel.update(dto);
    if (dto.assignedSections) {
      await this.scorecardCalcService.calculateAllRowsForProject(id).catch((err) => {
        console.error('Error calculating scorecard after updating assigned sections:', err);
      });
    }
    return this.findOne(id);
  }

  async assignSections(projectId: string, sectionIds: string[]): Promise<any> {
    const projectModel = await this.projectModel.findByPk(projectId);
    if (!projectModel) throw new NotFoundException(`Project ${projectId} not found`);

    if (!sectionIds || sectionIds.length === 0) {
      return this.findOne(projectId);
    }

    const sectionTemplates = await this.templateSectionModel.findAll({
      where: {
        id: sectionIds,
      },
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

    if (!sectionTemplates || sectionTemplates.length === 0) {
      throw new NotFoundException(`No template sections found for the provided IDs`);
    }

    let assignedSections: any[] = [...(projectModel.assignedSections || [])];

    for (const sectionTemplate of sectionTemplates) {
      const clonedSection = JSON.parse(JSON.stringify(sectionTemplate.toJSON()));
      const existingIndex = assignedSections.findIndex(
        (s: any) =>
          s.id === clonedSection.id ||
          (clonedSection.versionGroupId && s.versionGroupId === clonedSection.versionGroupId) ||
          (s.label && clonedSection.label && s.label.trim().toLowerCase() === clonedSection.label.trim().toLowerCase()),
      );

      if (existingIndex >= 0) {
        assignedSections[existingIndex] = clonedSection;
      } else {
        assignedSections.push(clonedSection);
      }
    }

    await projectModel.update({ assignedSections });

    // Immediately recalculate scorecard rows & rollup ONCE for all newly assigned sections
    await this.scorecardCalcService.calculateAllRowsForProject(projectId).catch((err) => {
      console.error('Error calculating scorecard after assigning sections:', err);
    });

    return this.findOne(projectId);
  }

  async assignSection(projectId: string, sectionId: string): Promise<any> {
    return this.assignSections(projectId, [sectionId]);
  }

  async updateData(projectId: string, updates: DataUpdateItemDto[]): Promise<void> {
    const transaction = await this.sequelize.transaction();
    let hasBaseUpdate = false;
    try {
      for (const update of updates) {
        if (update.columnId === '__base__') {
          hasBaseUpdate = true;
        }
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

    if (this.scorecardCalcService) {
      this.scorecardCalcService.calculateAllRowsForProject(projectId).catch(err => {
        console.error('Error during automatic scorecard recalculation:', err);
      });
    }
  }

  async recalculate(id: string): Promise<any> {
    if (this.scorecardCalcService) {
      await this.scorecardCalcService.calculateAllRowsForProject(id);
    }
    const project = await this.projectModel.findByPk(id);
    if (project && project.status !== ProjectStatus.PUBLISHED) {
      await project.update({ status: ProjectStatus.CALCULATED });
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const projectModel = await this.projectModel.findByPk(id);
    if (!projectModel) throw new NotFoundException(`Project with ID ${id} not found`);
    await projectModel.update({
      deleted: true,
      deletedAt: new Date(),
    });
  }

  async restore(id: string): Promise<any> {
    const projectModel = await this.projectModel.findByPk(id);
    if (!projectModel) throw new NotFoundException(`Project with ID ${id} not found`);
    await projectModel.update({
      deleted: false,
      deletedAt: null,
    });
    return this.findOne(id);
  }
}
