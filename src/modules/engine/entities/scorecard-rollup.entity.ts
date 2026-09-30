import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from '../../projects/entities/project.entity';

@Table({ tableName: 'ScorecardRollups', timestamps: true })
export class ScorecardRollup extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false, unique: true })
  projectId: string;

  @BelongsTo(() => Project)
  project: Project;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  overallScoreTenScale: number; // e.g. 6.4 / 10

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  overallScorePercentage: number; // e.g. 64.0 %

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'Average' })
  performanceBand: 'Poor' | 'Average' | 'Good' | 'Excellent';

  @Column({ type: DataType.JSONB, defaultValue: [] })
  categoryScores: Array<{
    categoryKey: string;
    categoryLabel: string;
    totalClientPoints: number;
    totalMaxPoints: number;
    scorePercentage: number;
    scoreTenScale: number;
    rank: number;
    metricsCount: number;
  }>;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isCalibrated: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  calibrationNotes: string;

  @Column({ type: DataType.JSONB, defaultValue: {} })
  analystOverrides: Record<string, {
    originalValue: any;
    calibratedValue: any;
    reason: string;
    calibratedBy: string;
    timestamp: string;
  }>;
}
