import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { TemplateCategory } from '../templates/entities/template-category.entity';
import { TemplateGroup } from '../templates/entities/template-group.entity';
import { TemplateColumn } from '../templates/entities/template-column.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectDataRecord } from '../projects/entities/project-data-record.entity';
import { AnalyticsWidget } from '../analytics/entities/analytics-widget.entity';
import { AppSettings } from '../settings/entities/app-settings.entity';
import { RatingBand } from '../settings/entities/rating-band.entity';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      TemplateSection,
      TemplateCategory,
      TemplateGroup,
      TemplateColumn,
      Project,
      ProjectDataRecord,
      AnalyticsWidget,
      AppSettings,
      RatingBand,
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
