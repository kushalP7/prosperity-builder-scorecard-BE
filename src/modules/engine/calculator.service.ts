import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Optional,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ScorecardRollup } from './entities/scorecard-rollup.entity';
import { Project, ProjectStatus } from '../projects/entities/project.entity';
import { ProjectDataRecord } from '../projects/entities/project-data-record.entity';
import { QuestionnaireSubmission } from '../intake/entities/questionnaire-submission.entity';
import { ExternalDataStaging } from '../ingestion/entities/external-data-staging.entity';
import { PaymentsService } from '../payments/payments.service';
import { MilestoneType } from '../payments/entities/payment-milestone.entity';
import { OrdersService } from '../orders/orders.service';
import { UploadsService } from '../uploads/uploads.service';
import { getErrorMessage } from '../../common/errors';
import { buildInitialScorecardPdf, buildTopLowPerformingPdf } from '../../common/initial-scorecard-pdf';

export type CertifiedReportPayload = {
  reportUrl: string;
  reportPublicId?: string;
  reportFileName?: string;
};

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
  private readonly logger = new Logger(CalculatorService.name);

  constructor(
    @InjectModel(ScorecardRollup) private rollupModel: typeof ScorecardRollup,
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectDataRecord) private recordModel: typeof ProjectDataRecord,
    @InjectModel(QuestionnaireSubmission) private questionnaireModel: typeof QuestionnaireSubmission,
    @InjectModel(ExternalDataStaging) private stagingModel: typeof ExternalDataStaging,
    private paymentsService: PaymentsService,
    @Optional()
    @Inject(forwardRef(() => OrdersService))
    private ordersService?: OrdersService,
    @Optional() private uploadsService?: UploadsService,
  ) {}

  private assertReportPayload(payload?: CertifiedReportPayload) {
    const url = String(payload?.reportUrl || '').trim();
    if (!url) {
      throw new BadRequestException('Certified project report PDF is required to publish.');
    }
    return {
      reportUrl: url,
      reportPublicId: payload?.reportPublicId ? String(payload.reportPublicId).trim() : null,
      reportFileName: payload?.reportFileName ? String(payload.reportFileName).trim() : url.split('/').pop() || 'certified-report.pdf',
    };
  }

  private async applyCertifiedReport(project: Project, payload: CertifiedReportPayload) {
    const next = this.assertReportPayload(payload);
    const previousUrl = project.certifiedReportUrl;
    const previousPublicId = project.certifiedReportPublicId;

    await project.update({
      certifiedReportUrl: next.reportUrl,
      certifiedReportPublicId: next.reportPublicId,
      certifiedReportFileName: next.reportFileName,
      certifiedReportUploadedAt: new Date(),
    });

    // Best-effort cleanup of previous file when replaced
    if ( this.uploadsService && previousUrl && previousUrl !== next.reportUrl ) {
      try {
        if (previousPublicId) {
          await this.uploadsService.deleteFile(previousPublicId, 'auto');
        } else {
          await this.uploadsService.deleteFileByUrl(previousUrl);
        }
      } catch (err: unknown) {
        this.logger.warn(`Failed to delete previous certified report: ${getErrorMessage(err)}`);
      }
    }

    return project;
  }

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

      const isMatch = assignedKeys.length === rollupKeys.length && assignedKeys.every((k: string) => rollupKeys.includes(k));

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

    const allRecords = await this.recordModel.findAll({ where: { projectId } });
    const recordsMap = new Map<string, any>();
    for (const r of allRecords) {
      recordsMap.set(`${r.nodeId}:${r.columnId}`, r);
    }

    const assignedSections = project.assignedSections || [];

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

    const categoryScores = assignedSections.map((sec: any, idx: number) => {
      const secTitle = sec.label || sec.title || `Section ${idx + 1}`;
      const secKey = secTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const scoreData = sectionScoreMap[secKey] || { clientTotal: 0, highestTotal: 0 };

      let baseClientPoints = scoreData.clientTotal;
      const baseMaxPoints = scoreData.highestTotal;

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

    const sorted = [...categoryScores].sort((a, b) => b.scoreTenScale - a.scoreTenScale);
    sorted.forEach((item, rIdx) => {
      const match = categoryScores.find((c) => c.categoryKey === item.categoryKey);
      if (match) match.rank = rIdx + 1;
    });

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

  async applyCalibration( projectId: string, overrides: Record<string, { originalValue: any; calibratedValue: any; reason: string; calibratedBy: string }>, notes?: string ): Promise<ScorecardRollup> {
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
      await this.ordersService?.syncTimelineForProject(projectId, ProjectStatus.IN_REVIEW);
    }

    return this.getRollup(projectId);
  }

  async publishScorecard(projectId: string, _report?: CertifiedReportPayload): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const rollup = await this.getRollup(projectId);
    if (!rollup?.categoryScores?.length) {
      throw new BadRequestException('Cannot publish: scorecard has no category scores yet. Calculate first.');
    }

    if (!this.uploadsService) {
      throw new BadRequestException('File storage is not configured; cannot generate the initial scorecard PDF.');
    }

    const jurisdictionLabel = [project.city, project.county, project.state].filter(Boolean).join(', ');
    const safeName = String(project.name || 'Scorecard')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 60);
    const fileName = `Initial-Scorecard-${safeName}.pdf`;

    const pdfBuffer = await buildInitialScorecardPdf({
      projectName: project.name,
      jurisdictionLabel: jurisdictionLabel || 'North Carolina',
      year: project.year,
      overallScoreTenScale: Number(rollup.overallScoreTenScale) || 0,
      performanceBand: String(rollup.performanceBand || 'Average'),
      categoryScores: (rollup.categoryScores || []).map((c: any) => ({
        categoryKey: c.categoryKey,
        categoryLabel: c.categoryLabel || c.categoryKey,
        scoreTenScale: Number(c.scoreTenScale) || 0,
        scorePercentage: Number(c.scorePercentage) || 0,
        rank: c.rank,
      })),
    });

    const previousUrl = project.initialReportUrl;
    const previousPublicId = project.initialReportPublicId;
    const wasAlreadyPublished = project.status === ProjectStatus.PUBLISHED;

    const uploaded = await this.uploadsService.uploadBuffer(
      pdfBuffer,
      fileName,
      'application/pdf',
      'reports',
    );

    await this.paymentsService.advanceMilestone(projectId, MilestoneType.FINAL_30);

    await project.update({
      status: ProjectStatus.PUBLISHED,
      initialReportUrl: uploaded.url,
      initialReportPublicId: uploaded.public_id,
      initialReportFileName: uploaded.originalName || fileName,
      initialReportGeneratedAt: new Date(),
    });
    await project.reload();
    await this.ordersService?.syncTimelineForProject(projectId, ProjectStatus.PUBLISHED);

    if (this.uploadsService && previousUrl && previousUrl !== uploaded.url) {
      try {
        if (previousPublicId) {
          await this.uploadsService.deleteFile(previousPublicId, 'auto');
        } else {
          await this.uploadsService.deleteFileByUrl(previousUrl);
        }
      } catch (err: unknown) {
        this.logger.warn(`Failed to delete previous initial report: ${getErrorMessage(err)}`);
      }
    }

    this.ordersService
      ?.sendCertifiedReportEmail(projectId, {
        isResend: wasAlreadyPublished && Boolean(previousUrl),
        reportKind: 'initial',
      })
      .then((r) => {
        if (r.sent) this.logger.log(`Initial scorecard emailed to ${r.to} for project ${projectId}`);
        else if (r.skipped) this.logger.log(`Initial scorecard email skipped for project ${projectId}: ${r.reason}`);
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Initial scorecard email soft-failed after publish for ${projectId}: ${getErrorMessage(err)}`,
        );
      });

    return {
      projectId,
      status: ProjectStatus.PUBLISHED,
      initialReportUrl: project.initialReportUrl,
      initialReportFileName: project.initialReportFileName,
      initialReportGeneratedAt: project.initialReportGeneratedAt,
      certifiedReportUrl: project.certifiedReportUrl,
      certifiedReportFileName: project.certifiedReportFileName,
      certifiedReportUploadedAt: project.certifiedReportUploadedAt,
      rollup,
      message:
        'Scorecard published. Initial PDF generated and emailed to the customer. Upload the detailed report when ready (typically 15–30 days).',
    };
  }

  /** Super-admin download: combined Top + Lowest performing modules PDF (published only). */
  async getTopLowPerformingPdf(projectId: string): Promise<{ buffer: Buffer; filename: string }> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.status !== ProjectStatus.PUBLISHED) {
      throw new BadRequestException('Publish the scorecard before downloading Top & Lowest reports.');
    }

    const rollup = await this.getRollup(projectId);
    if (!rollup?.categoryScores?.length) {
      throw new BadRequestException('No category scores available for this project.');
    }

    const jurisdictionLabel = [project.city, project.county, project.state].filter(Boolean).join(', ');
    const safeName = String(project.name || 'Scorecard')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .slice(0, 60);
    const filename = `Top-Low-Performing-${safeName}.pdf`;

    const buffer = await buildTopLowPerformingPdf({
      projectName: project.name,
      jurisdictionLabel: jurisdictionLabel || 'North Carolina',
      year: project.year,
      overallScoreTenScale: Number(rollup.overallScoreTenScale) || 0,
      performanceBand: String(rollup.performanceBand || 'Average'),
      categoryScores: (rollup.categoryScores || []).map((c: any) => ({
        categoryKey: c.categoryKey,
        categoryLabel: c.categoryLabel || c.categoryKey,
        scoreTenScale: Number(c.scoreTenScale) || 0,
        scorePercentage: Number(c.scorePercentage) || 0,
        rank: c.rank,
      })),
    });

    return { buffer, filename };
  }

  async replaceCertifiedReport(projectId: string, report: CertifiedReportPayload): Promise<any> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    if (project.status !== ProjectStatus.PUBLISHED) {
      throw new BadRequestException('Publish the scorecard before uploading the detailed report.');
    }

    const hadDetailed = Boolean(String(project.certifiedReportUrl || '').trim());
    await this.applyCertifiedReport(project, report);
    await project.reload();

    this.ordersService
      ?.sendCertifiedReportEmail(projectId, {
        isResend: hadDetailed,
        reportKind: 'detailed',
      })
      .then((r) => {
        if (r.sent) this.logger.log(`Detailed scorecard emailed to ${r.to} for project ${projectId}`);
        else if (r.skipped) this.logger.log(`Detailed report email skipped for project ${projectId}: ${r.reason}`);
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Detailed scorecard email soft-failed after upload for ${projectId}: ${getErrorMessage(err)}`,
        );
      });

    return {
      projectId,
      status: project.status,
      initialReportUrl: project.initialReportUrl,
      initialReportFileName: project.initialReportFileName,
      certifiedReportUrl: project.certifiedReportUrl,
      certifiedReportPublicId: project.certifiedReportPublicId,
      certifiedReportFileName: project.certifiedReportFileName,
      certifiedReportUploadedAt: project.certifiedReportUploadedAt,
      message: hadDetailed
        ? 'Detailed scorecard report replaced and emailed to the customer.'
        : 'Detailed scorecard report uploaded and emailed to the customer.',
    };
  }
}
