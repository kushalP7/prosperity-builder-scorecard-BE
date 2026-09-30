import { Table, Column, Model, DataType, HasMany, HasOne } from 'sequelize-typescript';
import { ProjectDataRecord } from './project-data-record.entity';
import { PaymentMilestone } from '../../payments/entities/payment-milestone.entity';
import { QuestionnaireSubmission } from '../../intake/entities/questionnaire-submission.entity';
import { ExternalDataStaging } from '../../ingestion/entities/external-data-staging.entity';
import { ScorecardRollup } from '../../engine/entities/scorecard-rollup.entity';

export enum ProjectStatus {
  ONBOARDING = 'ONBOARDING',
  INTAKE_PENDING = 'INTAKE_PENDING',
  INGESTION_RUNNING = 'INGESTION_RUNNING',
  CALCULATED = 'CALCULATED',
  IN_REVIEW = 'IN_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
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

  @Column({ type: DataType.STRING, defaultValue: 'COUNTY' })
  jurisdictionType: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  year: number;

  @Column({ 
    type: DataType.ENUM(...Object.values(ProjectStatus)), 
    defaultValue: ProjectStatus.INTAKE_PENDING 
  })
  status: ProjectStatus;

  @Column({ type: DataType.STRING, defaultValue: 'Scorecard Standard' })
  packageType: string;

  @Column({ type: DataType.DECIMAL(10, 2), defaultValue: 5000.00 })
  totalProjectValue: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  bypassPayments: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  image: string;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  assignedSections: any[]; // Deep-cloned TemplateSection snapshots

  @Column({ type: DataType.ARRAY(DataType.STRING), defaultValue: [] })
  enabledWidgets: string[];

  @Column({ type: DataType.JSONB, allowNull: true })
  dashboardLayout: any;

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
