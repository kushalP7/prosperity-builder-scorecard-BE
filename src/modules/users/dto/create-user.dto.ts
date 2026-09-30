import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'Samantha Vance' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'svance@roseassociates.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: ['super_admin', 'project_lead', 'assessment_specialist', 'client_viewer'], default: 'client_viewer' })
  @IsEnum(['super_admin', 'project_lead', 'assessment_specialist', 'client_viewer'])
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Real Estate Development' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ enum: ['active', 'pending', 'suspended'], default: 'active' })
  @IsEnum(['active', 'pending', 'suspended'])
  @IsOptional()
  status?: UserStatus;
}
