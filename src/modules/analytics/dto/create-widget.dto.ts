import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

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

export class CreateWidgetDto {
  @ApiProperty({ example: 'Transit Access Score Overview' })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ChartType, example: ChartType.SPEED_GAUGE })
  @IsEnum(ChartType)
  chartType: ChartType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  columnId?: string;

  @ApiProperty({ enum: WidgetAggregation, example: WidgetAggregation.AVERAGE })
  @IsEnum(WidgetAggregation)
  aggregation: WidgetAggregation;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customFormula?: string;
}
