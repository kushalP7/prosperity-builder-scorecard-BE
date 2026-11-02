import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

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

  @ApiProperty({ example: 'Sanford', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: '37', required: false })
  @IsOptional()
  @IsString()
  stateFips?: string;

  @ApiProperty({ example: '105', required: false })
  @IsOptional()
  @IsString()
  countyFips?: string;

  @ApiProperty({ example: '59000', required: false, description: 'Census place FIPS (CITY)' })
  @IsOptional()
  @IsString()
  placeFips?: string;

  @ApiProperty({ example: 'COUNTY', required: false, description: 'COUNTY | CITY' })
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

  @ApiProperty({ required: false, description: 'Owning customer user id' })
  @IsOptional()
  @IsString()
  customerUserId?: string;

  @ApiProperty({
    required: false,
    description: 'Paid order that unlocks this project slot (required for customer-created projects)',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  packageType?: string;
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
