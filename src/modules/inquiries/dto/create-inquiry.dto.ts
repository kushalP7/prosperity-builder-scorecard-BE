import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInquiryDto {
  @ApiProperty({ description: 'Contact first name', example: 'Sarah' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Contact last name', example: 'Jenkins' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: 'Organization / Company name', example: 'City of Davidson' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  organizationName: string;

  @ApiProperty({ description: 'Job title or role', example: 'Director of Economic Development' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  jobTitle: string;

  @ApiProperty({ description: 'Business email address', example: 'sjenkins@davidsonnc.gov' })
  @IsEmail({}, { message: 'Please provide a valid business email address' })
  @IsNotEmpty()
  @MaxLength(150)
  businessEmail: string;

  @ApiProperty({ description: 'Contact phone number', example: '(704) 555-0192' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber: string;

  @ApiProperty({ description: 'City', example: 'Davidson' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ description: 'State / Province', example: 'North Carolina' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @ApiProperty({ description: 'Country', example: 'United States' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    description: 'Type of organization',
    example: 'Municipal / City Government',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  organizationType: string;

  @ApiPropertyOptional({
    description: 'Optional preliminary notes or questions',
    example: 'Looking for a comprehensive economic baseline and 3-year scorecard updates.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
