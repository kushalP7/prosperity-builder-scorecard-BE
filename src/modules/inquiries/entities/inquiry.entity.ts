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

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'contacted', 'qualified', 'closed'),
    allowNull: false,
  })
  status: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
