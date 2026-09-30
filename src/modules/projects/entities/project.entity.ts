import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { ProjectDataRecord } from './project-data-record.entity';

@Table({ tableName: 'Projects', timestamps: true })
export class Project extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  clientName: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  year: number;

  @Column({ type: DataType.STRING, allowNull: true })
  image: string;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  assignedSections: any[]; // Deep-cloned TemplateSection snapshots

  @Column({ type: DataType.ARRAY(DataType.STRING), defaultValue: [] })
  enabledWidgets: string[];

  @Column({ type: DataType.JSONB, allowNull: true })
  dashboardLayout: any;

  @HasMany(() => ProjectDataRecord, { onDelete: 'CASCADE' })
  records: ProjectDataRecord[];
}
