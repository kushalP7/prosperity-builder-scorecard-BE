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
}
