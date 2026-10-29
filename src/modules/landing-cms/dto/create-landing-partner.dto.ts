import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreateLandingPartnerDto {
  @IsString()
  name: string;

  @IsString()
  logoUrl: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @IsIn(['published', 'draft'])
  status?: string;
}
