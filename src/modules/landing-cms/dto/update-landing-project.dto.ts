import { PartialType } from '@nestjs/swagger';
import { CreateLandingProjectDto } from './create-landing-project.dto';

export class UpdateLandingProjectDto extends PartialType(CreateLandingProjectDto) {}
