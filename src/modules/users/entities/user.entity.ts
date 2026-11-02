import { Table, Column, Model, DataType } from 'sequelize-typescript';

export type UserRole =
  | 'super_admin'
  | 'project_lead'
  | 'assessment_specialist'
  | 'customer';

export type SubscriptionStatus = 'none' | 'active' | 'expired' | 'cancelled';

export type UserStatus = 'active' | 'pending' | 'suspended';

@Table({ tableName: 'Users', timestamps: true })
export class User extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  password: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'customer',
    allowNull: false,
  })
  role: UserRole;

  /** Paid package entitlement — not a role rename. */
  @Column({
    type: DataType.STRING(50),
    defaultValue: 'none',
    allowNull: false,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ type: DataType.STRING(50), allowNull: true })
  subscriptionPackage: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  subscribedAt: Date | null;

  /** When paid entitlement ends (typically subscribedAt / renew + 1 year). */
  @Column({ type: DataType.DATE, allowNull: true })
  subscriptionExpiresAt: Date | null;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'Planning Board' })
  department: string;

  @Column({
    type: DataType.STRING(50),
    defaultValue: 'active',
    allowNull: false,
  })
  status: UserStatus;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'bg-rose-700 text-white' })
  avatarBg: string;

  /** Profile photo URL (S3/MinIO). */
  @Column({ type: DataType.TEXT, allowNull: true })
  avatarUrl: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  refreshTokenHash: string;

  /** Hashed one-time invite / set-password token (portal invite flow). */
  @Column({ type: DataType.STRING(128), allowNull: true })
  inviteTokenHash: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  inviteTokenExpiresAt: Date | null;

  /**
   * From enterprise inquiry lead role: county | city | partner_vendor | null.
   * Drives scorecard geography (COUNTY vs CITY place APIs).
   */
  @Column({ type: DataType.STRING(32), allowNull: true })
  leadRole: string | null;

  /** COUNTY | CITY — derived from leadRole for customers. */
  @Column({ type: DataType.STRING(16), allowNull: true, defaultValue: null })
  jurisdictionType: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  lastActive: Date;
}
