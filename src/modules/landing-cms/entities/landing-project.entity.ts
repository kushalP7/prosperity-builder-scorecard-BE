import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'LandingProjects', timestamps: true })
export class LandingProject extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.STRING, allowNull: false })
  category: string;

  @Column({ type: DataType.STRING, allowNull: false })
  studyType: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  latitude: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  longitude: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  pdfUrl: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  featured: boolean;

  @Column({ type: DataType.STRING, defaultValue: 'published' })
  status: string; // 'published' | 'draft'

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  deleted: boolean;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  deletedAt: Date | null;
}
