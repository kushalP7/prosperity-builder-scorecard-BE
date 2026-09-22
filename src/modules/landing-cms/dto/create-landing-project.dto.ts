import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateLandingProjectDto {
  @IsString()
  title: string;

  @IsString()
  category: string;

  @IsString()
  studyType: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  pdfUrl: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}
