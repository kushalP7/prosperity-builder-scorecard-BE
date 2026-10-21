import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ScorecardRollup } from './entities/scorecard-rollup.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { ProjectDataRecord } from '../projects/entities/project-data-record.entity';
import { QuestionnaireSubmission } from '../intake/entities/questionnaire-submission.entity';
import { ExternalDataStaging } from '../ingestion/entities/external-data-staging.entity';
import { PaymentsService } from '../payments/payments.service';
import { MilestoneType } from '../payments/entities/payment-milestone.entity';

export const SCORECARD_CATEGORIES = [
  { key: 'accessibility_transportation', label: 'Accessibility & Transportation' },
  { key: 'arts_culture', label: 'Arts & Culture' },
  { key: 'crime_public_safety', label: 'Crime & Public Safety' },
  { key: 'education', label: 'Education' },
  { key: 'employment_labor', label: 'Employment & Labor' },
  { key: 'goods_services', label: 'Goods & Services' },
  { key: 'healthcare_wellness', label: 'Healthcare & Wellness' },
  { key: 'historic_preservation', label: 'Historic Preservation' },
  { key: 'population_housing', label: 'Population & Housing' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'open_space_recreation', label: 'Open Space & Recreation' },
  { key: 'planning_land_use', label: 'Planning & Land Use' },
];

@Injectable()
export class CalculatorService {
  constructor(
    @InjectModel(ScorecardRollup) private rollupModel: typeof ScorecardRollup,
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectDataRecord) private recordModel: typeof ProjectDataRecord,
    @InjectModel(QuestionnaireSubmission) private questionnaireModel: typeof QuestionnaireSubmission,
    @InjectModel(ExternalDataStaging) private stagingModel: typeof ExternalDataStaging,
    private paymentsService: PaymentsService,
  ) {}

  private determineBand(tenScaleScore: number): 'Poor' | 'Average' | 'Good' | 'Excellent' {
    if (tenScaleScore <= 2.0) return 'Poor';
    if (tenScaleScore <= 7.0) return 'Average';
    if (tenScaleScore <= 9.0) return 'Good';
    return 'Excellent';
  }

  async getRollup(projectId: string): Promise<ScorecardRollup> {
    const project = await this.projectModel.findByPk(projectId);
    let rollup = await this.rollupModel.findOne({ where: { projectId } });

    if (!project) {
      if (!rollup) throw new NotFoundException(`Project ${projectId} not found`);
      return rollup;
    }

    const assignedSections = project.assignedSections || [];

    // Check if the current rollup's categories match the project's assigned sections
    if (rollup) {
      const assignedKeys = assignedSections.map((s: any, idx: number) => {
        const title = s.label || s.title || `Section ${idx + 1}`;
        return title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      });
      const rollupKeys = (rollup.categoryScores || []).map((c: any) => c.categoryKey);

      const isMatch =
        assignedKeys.length === rollupKeys.length &&
        assignedKeys.every((k: string) => rollupKeys.includes(k));

      if (isMatch) {
        return rollup;
      }
    }

    // Rollup missing or stale compared to current assigned sections -> recalculate immediately
    rollup = await this.calculateProjectScorecard(projectId);
    return rollup;
  }

  async calculateProjectScorecard(projectId: string): Promise<ScorecardRollup> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const questionnaire = await this.questionnaireModel.findOne({ where: { projectId } });
    const stagedData = await this.stagingModel.findAll({ where: { projectId } });
    const existingRollup = await this.rollupModel.findOne({ where: { projectId } });
    const overrides = existingRollup?.analystOverrides || {};

    // Fetch real project data records
    const allRecords = await this.recordModel.findAll({ where: { projectId } });
    const recordsMap = new Map<string, any>();
    for (const r of allRecords) {
      recordsMap.set(`${r.nodeId}:${r.columnId}`, r);
    }

    const assignedSections = project.assignedSections || [];

    // If project has no assigned sections, return an empty rollup with 0 score
    if (assignedSections.length === 0) {
      const emptyData = {
        overallScoreTenScale: 0,
        overallScorePercentage: 0,
        performanceBand: 'Average' as const,
        categoryScores: [],
      };
      if (existingRollup) {
        await existingRollup.update(emptyData);
        return existingRollup;
      }
      return this.rollupModel.create({
        projectId,
        ...emptyData,
        isCalibrated: false,
        calibrationNotes: null,
        analystOverrides: overrides,
      });
    }

    // Map section titles to category totals
    const sectionScoreMap: Record<string, { clientTotal: number; highestTotal: number }> = {};
    for (const sec of assignedSections) {
      const secTitle = (sec.label || sec.title || sec.id || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      let cTotal = 0;
      let hTotal = 0;
      for (const cat of sec.categories || []) {
        const columns = (sec.columns && sec.columns.length > 0) ? sec.columns : (cat.columns || []);
        const clientCol = columns.find((c: any) => /client.*total/i.test(c.name || '') || /total.*score/i.test(c.name || ''));
        const highestCol = columns.find((c: any) => /highest/i.test(c.name || ''));
        const nodes = cat.groups && cat.groups.length > 0 ? cat.groups : [cat];
        for (const n of nodes) {
          if (clientCol) {
            const cRec = recordsMap.get(`${n.id}:${clientCol.id}`);
            if (cRec && typeof cRec.value === 'number') cTotal += cRec.value;
          }
          if (highestCol) {
            const hRec = recordsMap.get(`${n.id}:${highestCol.id}`);
            if (hRec && typeof hRec.value === 'number') hTotal += hRec.value;
          }
        }
      }
      sectionScoreMap[secTitle] = { clientTotal: cTotal, highestTotal: hTotal };
    }

    // Compute category scores ONLY for assigned sections
    const categoryScores = assignedSections.map((sec: any, idx: number) => {
      const secTitle = sec.label || sec.title || `Section ${idx + 1}`;
      const secKey = secTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const scoreData = sectionScoreMap[secKey] || { clientTotal: 0, highestTotal: 0 };

      let baseClientPoints = scoreData.clientTotal;
      const baseMaxPoints = scoreData.highestTotal;

      // Check analyst overrides for this section
      if (overrides[secKey]?.calibratedValue !== undefined) {
        baseClientPoints = Number(overrides[secKey].calibratedValue);
      } else if (overrides[sec.id]?.calibratedValue !== undefined) {
        baseClientPoints = Number(overrides[sec.id].calibratedValue);
      }

      const totalClientPoints = Number(Math.min(baseClientPoints, baseMaxPoints > 0 ? baseMaxPoints : baseClientPoints).toFixed(1));
      const totalMaxPoints = Number(baseMaxPoints.toFixed(1));
      const scorePercentage = totalMaxPoints > 0 ? Number(((totalClientPoints / totalMaxPoints) * 100).toFixed(1)) : 0;
      const scoreTenScale = Number((scorePercentage / 10).toFixed(1));

      const metricsCount = (sec.categories || []).reduce((sum: number, c: any) => sum + (c.groups?.length || 1), 0);

      return {
        categoryKey: secKey,
        categoryLabel: secTitle,
        totalClientPoints,
        totalMaxPoints,
        scorePercentage,
        scoreTenScale,
        rank: 0,
        metricsCount: metricsCount || 6,
      };
    });

    // Rank assigned categories
    const sorted = [...categoryScores].sort((a, b) => b.scoreTenScale - a.scoreTenScale);
    sorted.forEach((item, rIdx) => {
      const match = categoryScores.find((c) => c.categoryKey === item.categoryKey);
      if (match) match.rank = rIdx + 1;
    });

    // Overall Scorecard Rollup = Average of assigned categories
    const sumTenScale = categoryScores.reduce((sum, c) => sum + c.scoreTenScale, 0);
    const overallScoreTenScale = categoryScores.length > 0 ? Number((sumTenScale / categoryScores.length).toFixed(1)) : 0;
    const overallScorePercentage = Number((overallScoreTenScale * 10).toFixed(1));
    const performanceBand = this.determineBand(overallScoreTenScale);

    if (existingRollup) {
      await existingRollup.update({
        overallScoreTenScale,
        overallScorePercentage,
        performanceBand,
        categoryScores,
      });
      return existingRollup;
    }

    const newRollup = await this.rollupModel.create({
      projectId,
      overallScoreTenScale,
      overallScorePercentage,
      performanceBand,
      categoryScores,
      isCalibrated: false,
      calibrationNotes: null,
      analystOverrides: overrides,
    });

    return newRollup;
  }

  async applyCalibration(
    projectId: string,
    overrides: Record<string, { originalValue: any; calibratedValue: any; reason: string; calibratedBy: string }>,
    notes?: string,
  ): Promise<ScorecardRollup> {
    const rollup = await this.getRollup(projectId);
    const mergedOverrides = { ...(rollup.analystOverrides || {}), ...overrides };

    await rollup.update({
      analystOverrides: mergedOverrides,
      isCalibrated: true,
      calibrationNotes: notes || rollup.calibrationNotes,
    });

    // Recalculate with new overrides
    await this.calculateProjectScorecard(projectId);

    // Set project status to IN_REVIEW
    const project = await this.projectModel.findByPk(projectId);
    if (project && project.status !== ProjectStatus.PUBLISHED) {
      await project.update({ status: ProjectStatus.IN_REVIEW });
    }

    return this.getRollup(projectId);
  }

  async publishScorecard(projectId: string): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    // Ensure rollup is computed
    const rollup = await this.getRollup(projectId);

    // Advance final 30% milestone (Bypassed)
    await this.paymentsService.advanceMilestone(projectId, MilestoneType.FINAL_30);

    // Mark project as PUBLISHED
    await project.update({ status: ProjectStatus.PUBLISHED });

    return {
      projectId,
      status: ProjectStatus.PUBLISHED,
      rollup,
      message: 'Scorecard successfully finalized, calibrated, and published for client release.',
    };
  }
}
