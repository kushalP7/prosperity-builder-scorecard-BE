import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Samantha Vance' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'svance@roseassociates.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'NewSecret123!' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ enum: ['super_admin', 'project_lead', 'assessment_specialist', 'client_viewer'] })
  @IsEnum(['super_admin', 'project_lead', 'assessment_specialist', 'client_viewer'])
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Real Estate Development' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ enum: ['active', 'pending', 'suspended'] })
  @IsEnum(['active', 'pending', 'suspended'])
  @IsOptional()
  status?: UserStatus;
}
