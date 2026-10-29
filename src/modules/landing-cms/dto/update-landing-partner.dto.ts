import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingPartnerDto } from './create-landing-partner.dto';

export class UpdateLandingPartnerDto extends PartialType(CreateLandingPartnerDto) {}
