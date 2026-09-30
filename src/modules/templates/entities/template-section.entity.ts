import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { TemplateCategory } from './template-category.entity';

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

  @HasMany(() => TemplateCategory, { onDelete: 'CASCADE' })
  categories: TemplateCategory[];
}
