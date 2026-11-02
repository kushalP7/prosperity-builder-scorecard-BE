import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsEmail } from 'class-validator';

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
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stateFips?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  countyFips?: string;

  @ApiProperty({ required: false, description: 'Census place FIPS (CITY)' })
  @IsOptional()
  @IsString()
  placeFips?: string;

  @ApiProperty({ required: false, description: 'COUNTY | CITY' })
  @IsOptional()
  @IsString()
  jurisdictionType?: string;

  @ApiProperty({
    required: false,
    description: 'True when location was explicitly chosen (not payment-seed defaults)',
  })
  @IsOptional()
  @IsBoolean()
  locationConfirmed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  packageType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  bypassPayments?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerUserId?: string;

  @ApiProperty({ required: false, description: 'Paid order that owns this project slot' })
  @IsOptional()
  @IsString()
  orderId?: string;
}
