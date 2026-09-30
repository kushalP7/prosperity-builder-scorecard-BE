import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from '../../projects/entities/project.entity';

export enum MilestoneType {
  INITIAL_40 = 'INITIAL_40', // 40% upon order creation
  MID_30 = 'MID_30',         // 30% after questionnaire submission
  FINAL_30 = 'FINAL_30',     // 30% prior to final dashboard release
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  BYPASSED = 'BYPASSED',     // Used for active development / pass-through
  FAILED = 'FAILED',
}

@Table({ tableName: 'PaymentMilestones', timestamps: true })
export class PaymentMilestone extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false })
  projectId: string;

  @BelongsTo(() => Project)
  project: Project;

  @Column({ type: DataType.ENUM(...Object.values(MilestoneType)), allowNull: false })
  milestoneType: MilestoneType;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 })
  amountDue: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  percentage: number; // 40, 30, or 30

  @Column({ 
    type: DataType.ENUM(...Object.values(PaymentStatus)), 
    defaultValue: PaymentStatus.BYPASSED 
  })
  status: PaymentStatus;

  @Column({ type: DataType.STRING, defaultValue: 'ACH' })
  paymentMethod: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'MANUAL' })
  provider: string; // 'STRIPE' | 'HUBSPOT' | 'MANUAL'

  @Column({ type: DataType.STRING, allowNull: true })
  transactionReference: string;

  @Column({ type: DataType.DATE, allowNull: true })
  clearedAt: Date;
}
