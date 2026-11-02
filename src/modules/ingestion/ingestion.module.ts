import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ExternalDataStaging } from './entities/external-data-staging.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectDataRecord } from '../projects/entities/project-data-record.entity';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';

import { QuestionnaireSubmission } from '../intake/entities/questionnaire-submission.entity';
import { EngineModule } from '../engine/engine.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    SequelizeModule.forFeature([ExternalDataStaging, Project, ProjectDataRecord, QuestionnaireSubmission]),
    EngineModule,
    AuthModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
