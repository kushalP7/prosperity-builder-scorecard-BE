import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Apex Tower Assessment' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Rose Associates Development' })
  @IsString()
  clientName: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  year: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'North Carolina', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'Lee County', required: false })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiProperty({ example: '37', required: false })
  @IsOptional()
  @IsString()
  stateFips?: string;

  @ApiProperty({ example: '105', required: false })
  @IsOptional()
  @IsString()
  countyFips?: string;
}

export class AssignSectionDto {
  @ApiProperty({ example: 's_section_uuid', required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({ example: ['s_section_uuid_1', 's_section_uuid_2'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionIds?: string[];
}
