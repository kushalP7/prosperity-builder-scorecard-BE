import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({ example: 'Accessibility & Transportation' })
  @IsString()
  label: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '#B5111B', required: false })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiProperty({ example: 'Layers', required: false })
  @IsOptional()
  @IsString()
  icon?: string;
}
