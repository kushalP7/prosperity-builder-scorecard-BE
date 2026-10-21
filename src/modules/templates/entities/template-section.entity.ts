import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { TemplateCategory } from './template-category.entity';
import { TemplateColumn } from './template-column.entity';

@Table({ tableName: 'TemplateSections', timestamps: true })
export class TemplateSection extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  label: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.STRING, defaultValue: '#B5111B' })
  accentColor: string;

  @Column({ type: DataType.STRING, defaultValue: 'Layers' })
  icon: string;

  @Column({ type: DataType.INTEGER, defaultValue: 1 })
  version: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isLatest: boolean;

  @Column({ type: DataType.STRING, defaultValue: 'active' })
  status: string; // 'active' | 'archived' | 'draft'

  @Column({ type: DataType.UUID, allowNull: true })
  versionGroupId: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  changelog: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  snapshot: any;

  @HasMany(() => TemplateCategory, { onDelete: 'CASCADE' })
  categories: TemplateCategory[];

  @HasMany(() => TemplateColumn, { onDelete: 'CASCADE' })
  columns: TemplateColumn[];
}
