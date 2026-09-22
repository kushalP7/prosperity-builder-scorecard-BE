import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LandingReport } from './entities/landing-report.entity';
import { LandingMedia } from './entities/landing-media.entity';
import { LandingProject } from './entities/landing-project.entity';
import { LandingReportsService } from './services/landing-reports.service';
import { LandingReportsController } from './controllers/landing-reports.controller';
import { LandingMediaService } from './services/landing-media.service';
import { LandingMediaController } from './controllers/landing-media.controller';
import { LandingProjectsService } from './services/landing-projects.service';
import { LandingProjectsController } from './controllers/landing-projects.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    SequelizeModule.forFeature([LandingReport, LandingMedia, LandingProject]),
    UploadsModule,
  ],
  controllers: [LandingReportsController, LandingMediaController, LandingProjectsController],
  providers: [LandingReportsService, LandingMediaService, LandingProjectsService],
  exports: [LandingReportsService, LandingMediaService, LandingProjectsService],
})
export class LandingCmsModule {}

