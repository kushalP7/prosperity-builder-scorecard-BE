import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Order } from './order.entity';

export type PaymentAttemptStatus = 'succeeded' | 'failed' | 'refunded';

@Table({ tableName: 'PaymentAttempts', timestamps: true })
export class PaymentAttempt extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  orderId: string;

  @BelongsTo(() => Order)
  order: Order;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amount: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  status: PaymentAttemptStatus;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'stub' })
  provider: string;

  @Column({ type: DataType.STRING, allowNull: true })
  method: string;

  @Column({ type: DataType.STRING, allowNull: true })
  cardLast4: string;

  @Column({ type: DataType.STRING, allowNull: false })
  reference: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  failureReason: string;
}
