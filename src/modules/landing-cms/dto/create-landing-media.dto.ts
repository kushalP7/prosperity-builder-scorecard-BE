import { IsString, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';

export class CreateLandingMediaDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsIn(['video', 'audio', 'document'])
  mediaType?: 'video' | 'audio' | 'document';

  @IsOptional()
  @IsString()
  videoSource?: string;

  @IsOptional()
  @IsString()
  audioSource?: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}
