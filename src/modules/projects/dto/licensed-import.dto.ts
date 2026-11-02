import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LicensedImportRowDto {
  @ApiProperty({ required: false, description: 'Exact scorecard node / group label' })
  @IsOptional()
  @IsString()
  metricLabel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nodeId?: string;

  @ApiProperty({ example: '54.2' })
  @IsString()
  value: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class LicensedImportDto {
  @ApiProperty({ enum: ['ESRI', 'COSTAR', 'MOODYS_CRE'] })
  @IsIn(['ESRI', 'COSTAR', 'MOODYS_CRE'])
  provider: 'ESRI' | 'COSTAR' | 'MOODYS_CRE';

  @ApiProperty({ type: [LicensedImportRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LicensedImportRowDto)
  rows: LicensedImportRowDto[];
}
