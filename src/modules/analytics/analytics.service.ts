import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AnalyticsWidget } from './entities/analytics-widget.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateWidgetDto } from './dto/create-widget.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsWidget) private widgetModel: typeof AnalyticsWidget,
    @InjectModel(Project) private projectModel: typeof Project,
  ) {}

  async findAllWidgets(): Promise<AnalyticsWidget[]> {
    return this.widgetModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async createWidget(dto: CreateWidgetDto): Promise<AnalyticsWidget> {
    return this.widgetModel.create(dto as any);
  }

  async updateWidget(id: string, dto: Partial<CreateWidgetDto>): Promise<AnalyticsWidget> {
    const widget = await this.widgetModel.findByPk(id);
    if (!widget) throw new NotFoundException(`Widget ${id} not found`);
    await widget.update(dto);
    return widget;
  }

  async deleteWidget(id: string): Promise<void> {
    const widget = await this.widgetModel.findByPk(id);
    if (widget) await widget.destroy();
  }

  async evaluateProjectWidget(projectId: string, widgetId: string) {
    const widget = await this.widgetModel.findByPk(widgetId);
    const project = await this.projectModel.findByPk(projectId, { include: ['records'] });
    if (!widget || !project) return [];

    // Map records by nodeId and columnId
    const recordsMap: Record<string, Record<string, any>> = {};
    for (const record of project.records || []) {
      if (!recordsMap[record.nodeId]) recordsMap[record.nodeId] = {};
      recordsMap[record.nodeId][record.columnId] = record;
    }

    const dataPoints: Array<{ name: string; value: number }> = [];
    const colId = widget.columnId || '__base__';

    for (const section of project.assignedSections || []) {
      let sectionTotal = 0;
      let count = 0;

      for (const category of section.categories || []) {
        const groups = category.groups?.length > 0 ? category.groups : [category];
        const firstCategory = section.categories?.[0];

        for (const group of groups) {
          let val = recordsMap[group.id]?.[colId]?.value;
          if (val === undefined && colId && firstCategory) {
            const targetColName = firstCategory.columns?.find((c: any) => c.id === colId)?.name;
            if (targetColName) {
              const catCol = category.columns?.find((c: any) => c.name === targetColName);
              if (catCol) {
                val = recordsMap[group.id]?.[catCol.id]?.value;
              }
            }
          }

          if (typeof val === 'number') {
            sectionTotal += val;
            count++;
          }
        }
      }

      let finalValue = 0;
      if (widget.aggregation === 'sum') finalValue = sectionTotal;
      else if (widget.aggregation === 'average' && count > 0) finalValue = sectionTotal / count;

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
