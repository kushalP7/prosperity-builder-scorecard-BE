import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'AnalyticsWidgets',
  timestamps: true,
})
export class AnalyticsWidget extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.STRING, allowNull: false })
  chartType: string;

  @Column({ type: DataType.STRING, allowNull: false })
  aggregation: string;

  @Column({ type: DataType.UUID, allowNull: true })
  sectionId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  categoryId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  columnId: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  customFormula: string;
}
