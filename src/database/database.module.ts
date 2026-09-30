import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppSettings } from '../modules/settings/entities/app-settings.entity';
import { RatingBand } from '../modules/settings/entities/rating-band.entity';
import { TemplateSection } from '../modules/templates/entities/template-section.entity';
import { TemplateCategory } from '../modules/templates/entities/template-category.entity';
import { TemplateGroup } from '../modules/templates/entities/template-group.entity';
import { TemplateColumn } from '../modules/templates/entities/template-column.entity';
import { ConditionalRule } from '../modules/templates/entities/conditional-rule.entity';
import { Project } from '../modules/projects/entities/project.entity';
import { ProjectDataRecord } from '../modules/projects/entities/project-data-record.entity';
import { AnalyticsWidget } from '../modules/analytics/entities/analytics-widget.entity';
import { LandingReport } from '../modules/landing-cms/entities/landing-report.entity';
import { LandingProject } from '../modules/landing-cms/entities/landing-project.entity';
import { LandingMedia } from '../modules/landing-cms/entities/landing-media.entity';
import { User } from '../modules/users/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'rose_associates_scorecard'),
        models: [
          User,
          AppSettings,
          RatingBand,
          TemplateSection,
          TemplateCategory,
          TemplateGroup,
          TemplateColumn,
          ConditionalRule,
          Project,
          ProjectDataRecord,
          AnalyticsWidget,
          LandingReport,
          LandingProject,
          LandingMedia,
        ],
        autoLoadModels: true,
        synchronize: true, // Sync database schema automatically in dev mode
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
