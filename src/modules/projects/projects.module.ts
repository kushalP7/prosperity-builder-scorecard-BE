import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from './entities/project.entity';
import { ProjectDataRecord } from './entities/project-data-record.entity';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

import { forwardRef } from '@nestjs/common';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Project, ProjectDataRecord, TemplateSection]),
    forwardRef(() => EngineModule),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, SequelizeModule],
})
export class ProjectsModule {}
