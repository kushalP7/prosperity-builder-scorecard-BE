import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppSettings } from '../modules/settings/entities/app-settings.entity';
import { RatingBand } from '../modules/settings/entities/rating-band.entity';
import { TemplateSection } from '../modules/templates/entities/template-section.entity';
import { TemplateCategory } from '../modules/templates/entities/template-category.entity';
import { TemplateGroup } from '../modules/templates/entities/template-group.entity';
import { TemplateColumn } from '../modules/templates/entities/template-column.entity';
import { Project } from '../modules/projects/entities/project.entity';
import { ProjectDataRecord } from '../modules/projects/entities/project-data-record.entity';
import { PaymentMilestone } from '../modules/payments/entities/payment-milestone.entity';
import { QuestionnaireSubmission } from '../modules/intake/entities/questionnaire-submission.entity';
import { ExternalDataStaging } from '../modules/ingestion/entities/external-data-staging.entity';
import { ScorecardRollup } from '../modules/engine/entities/scorecard-rollup.entity';
import { LandingReport } from '../modules/landing-cms/entities/landing-report.entity';
import { LandingProject } from '../modules/landing-cms/entities/landing-project.entity';
import { LandingMedia } from '../modules/landing-cms/entities/landing-media.entity';
import { AnalyticsWidget } from '../modules/analytics/entities/analytics-widget.entity';
import { User } from '../modules/users/entities/user.entity';
import { Inquiry } from '../modules/inquiries/entities/inquiry.entity';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        models: [
          User,
          AppSettings,
          RatingBand,
          TemplateSection,
          TemplateCategory,
          TemplateGroup,
          TemplateColumn,
          Project,
          ProjectDataRecord,
          PaymentMilestone,
          QuestionnaireSubmission,
          ExternalDataStaging,
          ScorecardRollup,
          LandingReport,
          LandingProject,
          LandingMedia,
          AnalyticsWidget,
          Inquiry,
        ],
        autoLoadModels: true,
        synchronize: true, // Sync database schema automatically in dev mode
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
      }),
    }),
  ],
})
export class DatabaseModule { }
