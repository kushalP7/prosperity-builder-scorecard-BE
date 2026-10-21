import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Interstate Routes' })
  @IsString()
  label: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: 2, required: false })
  @IsOptional()
  weight?: number;

  @ApiProperty({ default: 4, required: false })
  @IsOptional()
  highestScore?: number;

  @ApiProperty({ default: [], required: false })
  @IsOptional()
  scoringRules?: any[];

  @ApiProperty({ default: {}, required: false })
  @IsOptional()
  columnDefaults?: Record<string, any>;

  @ApiProperty({ enum: ['value', 'boolean'], default: 'value', required: false })
  @IsOptional()
  @IsString()
  scoringType?: 'value' | 'boolean';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  formula?: string;
}
