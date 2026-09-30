import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Project } from '../../projects/entities/project.entity';

export enum ApiDataSource {
  US_CENSUS = 'US_CENSUS',
  ESRI = 'ESRI',
  BLS = 'BLS',
  EPA = 'EPA',
  NCDOT_GIS = 'NCDOT_GIS',
  NC_DPI = 'NC_DPI',
}

@Table({ tableName: 'ExternalDataStaging', timestamps: true })
export class ExternalDataStaging extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false })
  projectId: string;

  @BelongsTo(() => Project)
  project: Project;

  @Column({ type: DataType.ENUM(...Object.values(ApiDataSource)), allowNull: false })
  source: ApiDataSource;

  @Column({ type: DataType.STRING, allowNull: false })
  categoryKey: string;

  @Column({ type: DataType.STRING, allowNull: false })
  metricKey: string;

  @Column({ type: DataType.STRING, allowNull: false })
  metricLabel: string;

  @Column({ type: DataType.JSONB, allowNull: true })
  rawResponse: any;

  @Column({ type: DataType.FLOAT, allowNull: true })
  extractedValue: number;

  @Column({ type: DataType.STRING, allowNull: true })
  unit: string;

  @Column({ type: DataType.STRING, defaultValue: 'FETCHED' })
  ingestionStatus: 'FETCHED' | 'PARSED' | 'ERROR';
}
