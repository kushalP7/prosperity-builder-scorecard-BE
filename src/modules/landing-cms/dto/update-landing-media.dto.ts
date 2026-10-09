import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingMediaDto } from './create-landing-media.dto';

export class UpdateLandingMediaDto extends PartialType(CreateLandingMediaDto) {}
