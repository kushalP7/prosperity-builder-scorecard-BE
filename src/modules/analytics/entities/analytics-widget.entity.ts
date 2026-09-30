import { Table, Column, Model, DataType } from 'sequelize-typescript';

export enum ChartType {
  SPEED_GAUGE = 'speed_gauge',
  BAR_CHART = 'bar_chart',
  LINE_CHART = 'line_chart',
  PIE_CHART = 'pie_chart',
  STAT_CARD = 'stat_card',
  AREA_CHART = 'area_chart',
  RADAR_CHART = 'radar_chart',
  DONUT_CHART = 'donut_chart',
  HEAT_CHART = 'heat_chart',
}

export enum WidgetAggregation {
  SUM = 'sum',
  AVERAGE = 'average',
  FORMULA = 'formula',
}

@Table({ tableName: 'AnalyticsWidgets', timestamps: true })
export class AnalyticsWidget extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Column({ type: DataType.ENUM(...Object.values(ChartType)), allowNull: false })
  chartType: ChartType;

  @Column({ type: DataType.UUID, allowNull: true })
  sectionId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  categoryId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  columnId: string;

  @Column({ type: DataType.ENUM(...Object.values(WidgetAggregation)), allowNull: false })
  aggregation: WidgetAggregation;

  @Column({ type: DataType.TEXT, allowNull: true })
  customFormula: string;
}
