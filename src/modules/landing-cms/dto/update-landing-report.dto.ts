import { PartialType } from '@nestjs/mapped-types';
import { CreateLandingReportDto } from './create-landing-report.dto';

export class UpdateLandingReportDto extends PartialType(CreateLandingReportDto) {}
