import { PartialType } from '@nestjs/swagger';
import { CreateLandingMediaDto } from './create-landing-media.dto';

export class UpdateLandingMediaDto extends PartialType(CreateLandingMediaDto) {}
