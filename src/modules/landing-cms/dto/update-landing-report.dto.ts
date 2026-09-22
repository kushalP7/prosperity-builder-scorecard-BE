import { PartialType } from '@nestjs/swagger';
import { CreateLandingReportDto } from './create-landing-report.dto';

export class UpdateLandingReportDto extends PartialType(CreateLandingReportDto) {}
