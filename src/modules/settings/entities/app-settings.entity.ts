import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { RatingBand } from './rating-band.entity';

@Table({ tableName: 'AppSettings', timestamps: true })
export class AppSettings extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, defaultValue: 'Rose Associates', allowNull: false })
  companyName: string;

  @Column({ type: DataType.STRING, allowNull: true })
  companyLogoUrl: string;

  @Column({ type: DataType.STRING, allowNull: true })
  companyAddress: string;

  @Column({ type: DataType.STRING, allowNull: true })
  companyPhone: string;

  @HasMany(() => RatingBand)
  ratingBands: RatingBand[];
}
