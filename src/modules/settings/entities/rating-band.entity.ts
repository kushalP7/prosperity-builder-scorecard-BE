import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { AppSettings } from './app-settings.entity';

@Table({ tableName: 'RatingBands', timestamps: true })
export class RatingBand extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => AppSettings)
  @Column({ type: DataType.UUID, allowNull: false })
  settingsId: string;

  @BelongsTo(() => AppSettings)
  settings: AppSettings;

  @Column({ type: DataType.STRING, allowNull: false })
  label: string; // e.g. "Poor", "Average", "Good", "Excellent"

  @Column({ type: DataType.FLOAT, allowNull: false })
  min: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  max: number;

  @Column({ type: DataType.STRING, allowNull: false })
  color: string; // Hex color code e.g. "#B5101A"
}
