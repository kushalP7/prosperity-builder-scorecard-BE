import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class RatingBandDto {
  @ApiProperty({ example: 'Poor' })
  @IsString()
  label: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  min: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  max: number;

  @ApiProperty({ example: '#B5101A' })
  @IsString()
  color: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ example: 'Rose Associates', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyLogoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  companyProfile?: {
    name?: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  planPrices?: {
    reportPrice: number;
    subscriptionPrice: number;
    combinedPrice: number;
  };

  @ApiProperty({ type: [RatingBandDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingBandDto)
  ratingBands?: RatingBandDto[];
}
