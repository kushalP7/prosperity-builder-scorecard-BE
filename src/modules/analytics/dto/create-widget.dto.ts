import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ChartType, WidgetAggregation } from '../entities/analytics-widget.entity';

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
