import { Table, Column, Model, DataType, HasMany, HasOne } from 'sequelize-typescript';
import { ProjectDataRecord } from './project-data-record.entity';
import { PaymentMilestone } from '../../payments/entities/payment-milestone.entity';
import { QuestionnaireSubmission } from '../../intake/entities/questionnaire-submission.entity';
import { ExternalDataStaging } from '../../ingestion/entities/external-data-staging.entity';
import { ScorecardRollup } from '../../engine/entities/scorecard-rollup.entity';

export enum ProjectStatus {
  INTAKE_PENDING = 'INTAKE_PENDING',
  INTAKE_SUBMITTED = 'INTAKE_SUBMITTED',
  CALCULATED = 'CALCULATED',
  IN_REVIEW = 'IN_REVIEW',
  PUBLISHED = 'PUBLISHED',
}

@Table({ tableName: 'Projects', timestamps: true })
export class Project extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  clientName: string;

  @Column({ type: DataType.STRING, allowNull: true })
  clientEmail: string;

  /** Owning customer account — customers only see projects where this matches their user id. */
  @Column({ type: DataType.UUID, allowNull: true })
  customerUserId: string | null;

  /**
   * Paid package order that unlocked this project slot.
   * Production source of truth for “projects in this order” (1 order → N projects).
   */
  @Column({ type: DataType.UUID, allowNull: true })
  orderId: string | null;

  /** COUNTY | CITY — from customer lead role / staff selection. */
  @Column({ type: DataType.STRING, defaultValue: 'COUNTY' })
  jurisdictionType: string;

  @Column({ type: DataType.STRING, defaultValue: 'North Carolina' })
  state: string;

  @Column({ type: DataType.STRING, defaultValue: 'Lee County' })
  county: string;

  /** Incorporated place / city name (CITY jurisdiction). */
  @Column({ type: DataType.STRING, allowNull: true })
  city: string | null;

  @Column({ type: DataType.STRING, defaultValue: '37' })
  stateFips: string;

  @Column({ type: DataType.STRING, defaultValue: '105' })
  countyFips: string;

  /** Census place FIPS (5-digit) for CITY jurisdiction ACS pulls. */
  @Column({ type: DataType.STRING(5), allowNull: true })
  placeFips: string | null;

  /** True once customer/staff explicitly saved location (not payment-seed defaults). */
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  locationConfirmed: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false })
  year: number;

  @Column({
    type: DataType.ENUM(...Object.values(ProjectStatus)),
    defaultValue: ProjectStatus.INTAKE_PENDING
  })
  status: ProjectStatus;

  @Column({ type: DataType.STRING, defaultValue: 'Scorecard Standard' })
  packageType: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  bypassPayments: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  image: string;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  assignedSections: any[]; // Deep-cloned TemplateSection snapshots

  @Column({ type: DataType.ARRAY(DataType.STRING), defaultValue: [] })
  enabledWidgets: string[];

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  deleted: boolean;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  deletedAt: Date | null;

  /** Auto-generated Initial Scorecard PDF (created on publish) */
  @Column({ type: DataType.TEXT, allowNull: true })
  initialReportUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  initialReportPublicId: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  initialReportFileName: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  initialReportGeneratedAt: Date | null;

  /** Detailed / certified executive PDF (admin upload ~15–30 days after publish) */
  @Column({ type: DataType.TEXT, allowNull: true })
  certifiedReportUrl: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  certifiedReportPublicId: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  certifiedReportFileName: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  certifiedReportUploadedAt: Date | null;

  @HasMany(() => ProjectDataRecord, { onDelete: 'CASCADE' })
  records: ProjectDataRecord[];

  @HasMany(() => PaymentMilestone, { onDelete: 'CASCADE' })
  paymentMilestones: PaymentMilestone[];

  @HasOne(() => QuestionnaireSubmission, { onDelete: 'CASCADE' })
  questionnaireSubmission: QuestionnaireSubmission;

  @HasMany(() => ExternalDataStaging, { onDelete: 'CASCADE' })
  externalDataRecords: ExternalDataStaging[];

  @HasOne(() => ScorecardRollup, { onDelete: 'CASCADE' })
  rollup: ScorecardRollup;
}
