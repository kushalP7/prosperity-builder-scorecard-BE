import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'LandingPartners', timestamps: true })
export class LandingPartner extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  logoUrl: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  sortOrder: number;

  @Column({ type: DataType.STRING, defaultValue: 'published' })
  status: string; // 'published' | 'draft'

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  deleted: boolean;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  deletedAt: Date | null;
}
