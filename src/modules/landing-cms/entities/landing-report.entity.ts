import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'landing_reports', timestamps: true })
export class LandingReport extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  slug: string;

  @Column({ type: DataType.STRING, allowNull: true })
  subtitle: string;

  @Column({ type: DataType.STRING, allowNull: true, defaultValue: 'Kathleen Rose, CCIM, CRE' })
  author: string;

  @Column({ type: DataType.DATE, allowNull: true })
  publishedAt: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  coverImage: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  pdfUrl: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  summary: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  contentHtml: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  featured: boolean;

  @Column({ type: DataType.STRING, defaultValue: 'published' })
  status: string;

  @Column({ type: DataType.JSONB, defaultValue: [] })
  blocks: any[];

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  deleted: boolean;

  @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
  deletedAt: Date | null;
}
