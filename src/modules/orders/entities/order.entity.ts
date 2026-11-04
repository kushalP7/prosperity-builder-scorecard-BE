import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { PaymentAttempt } from './payment-attempt.entity';

export type PackageType = 'scorecard_only' | 'subscription' | 'combined';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

@Table({ tableName: 'Orders', timestamps: true })
export class Order extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  orderNumber: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  packageType: PackageType;

  @Column({ type: DataType.STRING, allowNull: false })
  packageName: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amountDue: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  amountPaid: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: 'pending',
  })
  status: OrderStatus;

  @Column({ type: DataType.STRING, allowNull: false })
  customerName: string;

  @Column({ type: DataType.STRING, allowNull: false })
  customerEmail: string;

  @Column({ type: DataType.STRING, allowNull: true })
  organization: string;

  /** Owning customer account. Projects link via Projects.orderId. */
  @Column({ type: DataType.UUID, allowNull: true })
  customerUserId: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'invoice' })
  provider: string; // invoice (offline); legacy: stub | stripe

  /** Legacy Stripe PaymentIntent id — unused for new invoice-only checkout */
  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  stripePaymentIntentId: string;

  @Column({ type: DataType.DATE, allowNull: true })
  paidAt: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  refundedAt: Date;

  /** How many payment-reminder emails staff have sent for this order. */
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  reminderSentCount: number;

  @HasMany(() => PaymentAttempt)
  paymentAttempts: PaymentAttempt[];
}
