import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TemplateSection } from './entities/template-section.entity';
import { TemplateCategory } from './entities/template-category.entity';
import { TemplateGroup } from './entities/template-group.entity';
import { TemplateColumn } from './entities/template-column.entity';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      TemplateSection,
      TemplateCategory,
      TemplateGroup,
      TemplateColumn,
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService, SequelizeModule],
})
export class TemplatesModule {}
