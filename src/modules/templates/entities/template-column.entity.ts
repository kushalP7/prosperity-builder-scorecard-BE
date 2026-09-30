import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { TemplateCategory } from './template-category.entity';
import { TemplateGroup } from './template-group.entity';

export enum ColumnType {
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  TEXT = 'text',
  FORMULA = 'formula',
  SELECT = 'select',
}

@Table({ tableName: 'TemplateColumns', timestamps: true })
export class TemplateColumn extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => TemplateCategory)
  @Column({ type: DataType.UUID, allowNull: true })
  categoryId: string;

  @BelongsTo(() => TemplateCategory)
  category: TemplateCategory;

  @ForeignKey(() => TemplateGroup)
  @Column({ type: DataType.UUID, allowNull: true })
  groupId: string;

  @BelongsTo(() => TemplateGroup)
  group: TemplateGroup;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.ENUM(...Object.values(ColumnType)), allowNull: false })
  type: ColumnType;

  @Column({ type: DataType.STRING, allowNull: true })
  unit: string;

  @Column({ type: DataType.FLOAT, defaultValue: 1.0 })
  weight: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isBonus: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isReadOnly: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  formulaExpression: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  options: any[]; // Select dropdown options [{ label, value }]

  @Column({ type: DataType.FLOAT, allowNull: true })
  validationMin: number;

  @Column({ type: DataType.FLOAT, allowNull: true })
  validationMax: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  scoringRule: any; // Discriminated union rule object
}
