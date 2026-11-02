import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

export type InquiryStatus = 'pending' | 'invited' | 'registered' | 'closed';

@Table({
  tableName: 'Inquiries',
  timestamps: true,
})
export class Inquiry extends Model<Inquiry> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  firstName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  lastName: string;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  organizationName: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  jobTitle: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  businessEmail: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  phoneNumber: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  city: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  state: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    defaultValue: 'United States',
  })
  country: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  organizationType: string;

  /** Exactly one: county | city | partner_vendor */
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    defaultValue: 'partner_vendor',
  })
  leadRole: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  /** pending | invited | registered | closed (legacy contacted/qualified mapped as closed-ish) */
  @Default('pending')
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  status: InquiryStatus | string;

  /** Linked customer user after portal invite */
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  userId: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  invitedAt: Date | null;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
