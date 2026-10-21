import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsObject } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  year?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  enabledWidgets?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  dashboardLayout?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  assignedSections?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stateFips?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  countyFips?: string;
}
