import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Kushal Customer' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatars/user.jpg',
    description: 'Profile photo URL from /uploads/image. Pass null or empty to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string | null;
}
