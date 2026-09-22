import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from './project.entity';

@Table({ 
  tableName: 'project_data_records', 
  timestamps: true,
  indexes: [{ unique: true, fields: ['projectId', 'nodeId', 'columnId'] }]
})
export class ProjectDataRecord extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false })
  projectId: string;

  @BelongsTo(() => Project)
  project: Project;

  @Column({ type: DataType.STRING, allowNull: false })
  nodeId: string; // Category or Group UUID

  @Column({ type: DataType.STRING, allowNull: false })
  columnId: string; // "__base__" or Column UUID

  @Column({ type: DataType.JSONB, allowNull: true })
  value: any;

  @Column({ type: DataType.TEXT, allowNull: true })
  source: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Column({ type: DataType.FLOAT, allowNull: true })
  scoreValue: number;
}
