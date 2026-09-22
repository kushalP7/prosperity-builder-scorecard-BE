import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { TemplateCategory } from './template-category.entity';
import { TemplateColumn } from './template-column.entity';

@Table({ tableName: 'template_groups', timestamps: true })
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

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  takesValues: boolean;

  @HasMany(() => TemplateColumn, { onDelete: 'CASCADE' })
  columns: TemplateColumn[];
}
