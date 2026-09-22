import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsObject, IsArray } from 'class-validator';
import { ColumnType } from '../entities/template-column.entity';

export class CreateColumnDto {
  @ApiProperty({ example: 'Weight (1-4)' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ColumnType, example: ColumnType.NUMBER })
  @IsEnum(ColumnType)
  type: ColumnType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isBonus?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  formulaExpression?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  options?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  validationMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  validationMax?: number;

  @ApiProperty({ example: { kind: 'manual', maxPoints: 10 } })
  @IsObject()
  scoringRule: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  conditionalRules?: any[];
}
