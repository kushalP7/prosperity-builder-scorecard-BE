import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

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
}

export class AssignSectionDto {
  @ApiProperty({ example: 's_section_uuid' })
  @IsString()
  sectionId: string;
}
