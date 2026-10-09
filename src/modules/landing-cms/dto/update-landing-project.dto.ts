import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingProjectDto } from './create-landing-project.dto';

export class UpdateLandingProjectDto extends PartialType(CreateLandingProjectDto) {}
