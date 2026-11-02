import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from './entities/project.entity';
import { ProjectDataRecord } from './entities/project-data-record.entity';
import { TemplateSection } from '../templates/entities/template-section.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { EngineModule } from '../engine/engine.module';
import { ScorecardRollup } from '../engine/entities/scorecard-rollup.entity';
import { AuthModule } from '../auth/auth.module';
import { Order } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Project, ProjectDataRecord, TemplateSection, ScorecardRollup, Order]),
    forwardRef(() => EngineModule),
    forwardRef(() => OrdersModule),
    AuthModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, SequelizeModule],
})
export class ProjectsModule { }
