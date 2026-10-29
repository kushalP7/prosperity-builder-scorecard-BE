import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LandingReport } from './entities/landing-report.entity';
import { LandingMedia } from './entities/landing-media.entity';
import { LandingProject } from './entities/landing-project.entity';
import { LandingPartner } from './entities/landing-partner.entity';
import { LandingReportsService } from './services/landing-reports.service';
import { LandingReportsController } from './controllers/landing-reports.controller';
import { LandingMediaService } from './services/landing-media.service';
import { LandingMediaController } from './controllers/landing-media.controller';
import { LandingProjectsService } from './services/landing-projects.service';
import { LandingProjectsController } from './controllers/landing-projects.controller';
import { LandingPartnersService } from './services/landing-partners.service';
import { LandingPartnersController } from './controllers/landing-partners.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    SequelizeModule.forFeature([LandingReport, LandingMedia, LandingProject, LandingPartner]),
    UploadsModule,
  ],
  controllers: [
    LandingReportsController,
    LandingMediaController,
    LandingProjectsController,
    LandingPartnersController,
  ],
  providers: [
    LandingReportsService,
    LandingMediaService,
    LandingProjectsService,
    LandingPartnersService,
  ],
  exports: [
    LandingReportsService,
    LandingMediaService,
    LandingProjectsService,
    LandingPartnersService,
  ],
})
export class LandingCmsModule {}

