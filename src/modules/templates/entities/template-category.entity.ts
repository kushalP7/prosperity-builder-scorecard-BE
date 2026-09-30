import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { TemplateSection } from './template-section.entity';
import { TemplateGroup } from './template-group.entity';
import { TemplateColumn } from './template-column.entity';

@Table({ tableName: 'TemplateCategories', timestamps: true })
export class TemplateCategory extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => TemplateSection)
  @Column({ type: DataType.UUID, allowNull: false })
  sectionId: string;

  @BelongsTo(() => TemplateSection)
  section: TemplateSection;

  @Column({ type: DataType.STRING, allowNull: false })
  label: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  takesValues: boolean;

  @HasMany(() => TemplateGroup, { onDelete: 'CASCADE' })
  groups: TemplateGroup[];

  @HasMany(() => TemplateColumn, { onDelete: 'CASCADE' })
  columns: TemplateColumn[];
}
