import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { TemplateCategory } from './template-category.entity';

@Table({ tableName: 'TemplateGroups', timestamps: true })
export class TemplateGroup extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => TemplateCategory)
  @Column({ type: DataType.UUID, allowNull: false })
  categoryId: string;

  @BelongsTo(() => TemplateCategory)
  category: TemplateCategory;

  @Column({ type: DataType.STRING, allowNull: false })
  label: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.FLOAT, defaultValue: 2.0, allowNull: true })
  weight: number;

  @Column({ type: DataType.FLOAT, defaultValue: 4.0, allowNull: true })
  highestScore: number;

  @Column({ type: DataType.JSONB, defaultValue: [], allowNull: true })
  scoringRules: any[];

  @Column({ type: DataType.JSONB, defaultValue: {}, allowNull: true })
  columnDefaults: Record<string, any>;

  @Column({ type: DataType.STRING, defaultValue: 'value', allowNull: true })
  scoringType: 'value' | 'boolean';

  @Column({ type: DataType.TEXT, allowNull: true })
  formula: string;
}
