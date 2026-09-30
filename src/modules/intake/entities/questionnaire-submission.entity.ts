import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from '../../projects/entities/project.entity';

export enum QuestionnaireStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
}

@Table({ tableName: 'QuestionnaireSubmissions', timestamps: true })
export class QuestionnaireSubmission extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  projectId: string;

  @BelongsTo(() => Project)
  project: Project;

  @Column({ 
    type: DataType.ENUM(...Object.values(QuestionnaireStatus)), 
    defaultValue: QuestionnaireStatus.DRAFT 
  })
  status: QuestionnaireStatus;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  completedPointsCount: number;

  @Column({ type: DataType.INTEGER, defaultValue: 92 })
  totalPointsCount: number;

  @Column({ type: DataType.JSONB, defaultValue: {} })
  answersPayload: Record<string, {
    value: any;
    unit?: string;
    notes?: string;
    documentUrl?: string;
    updatedAt?: string;
  }>;

  @Column({ type: DataType.DATE, allowNull: true })
  submittedAt: Date;
}
