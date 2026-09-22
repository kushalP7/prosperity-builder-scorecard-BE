import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from './entities/project.entity';
import { ProjectDataRecord } from './entities/project-data-record.entity';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([Project, ProjectDataRecord, TemplateSection]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, SequelizeModule],
})
export class ProjectsModule {}
