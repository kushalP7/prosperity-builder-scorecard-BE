import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../projects/entities/project.entity';
import { AnalyticsWidget } from './entities/analytics-widget.entity';
import { CreateWidgetDto } from './dto/create-widget.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(AnalyticsWidget) private widgetModel: typeof AnalyticsWidget,
  ) {}

  async findAllWidgets(): Promise<any[]> {
    return this.widgetModel.findAll({
      order: [['createdAt', 'ASC']],
    });
  }

  async createWidget(dto: CreateWidgetDto): Promise<any> {
    return this.widgetModel.create(dto as any);
  }

  async updateWidget(id: string, dto: Partial<CreateWidgetDto>): Promise<any> {
    const widget = await this.widgetModel.findByPk(id);
    if (!widget) throw new NotFoundException(`Widget ${id} not found`);
    return widget.update(dto as any);
  }

  async deleteWidget(id: string): Promise<void> {
    const widget = await this.widgetModel.findByPk(id);
    if (widget) {
      await widget.destroy();
    }
  }

  async evaluateProjectWidget(projectId: string, widgetId?: string) {
    const project = await this.projectModel.findByPk(projectId, { include: ['records'] });
    if (!project) return [];

    // Map records by nodeId and columnId
    const recordsMap: Record<string, Record<string, any>> = {};
    for (const record of project.records || []) {
      if (!recordsMap[record.nodeId]) recordsMap[record.nodeId] = {};
      recordsMap[record.nodeId][record.columnId] = record;
    }

    const dataPoints: Array<{ name: string; value: number }> = [];
    const colId = '__base__';

    for (const section of project.assignedSections || []) {
      let sectionTotal = 0;
      let count = 0;

      for (const category of section.categories || []) {
        const groups = category.groups?.length > 0 ? category.groups : [category];
        for (const group of groups) {
          const val = recordsMap[group.id]?.[colId]?.value;
          if (typeof val === 'number') {
            sectionTotal += val;
            count++;
          }
        }
      }

      const finalValue = count > 0 ? sectionTotal / count : 0;
      dataPoints.push({
        name: section.label,
        value: Number(finalValue.toFixed(2)),
      });
    }

    return dataPoints;
  }

  async getOverallAnalytics() {
    const projects = await this.projectModel.findAll({ include: ['records'] });
    const totalProjects = projects.length;

    const sectorAverages: Record<string, number> = {};
    let globalSum = 0;

    for (const project of projects) {
      for (const section of project.assignedSections || []) {
        let sectionSum = 0;
        for (const record of project.records || []) {
          if (typeof record.value === 'number') sectionSum += record.value;
        }
        sectorAverages[section.label] = (sectorAverages[section.label] || 0) + sectionSum;
        globalSum += sectionSum;
      }
    }

    const overallAverage = totalProjects > 0 ? Number((globalSum / totalProjects).toFixed(2)) : 0;

    return {
      totalProjects,
      overallAverage,
      sectorAverages,
    };
  }
}
