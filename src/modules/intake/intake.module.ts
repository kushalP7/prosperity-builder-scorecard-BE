import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuestionnaireSubmission } from './entities/questionnaire-submission.entity';
import { Project } from '../projects/entities/project.entity';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    SequelizeModule.forFeature([QuestionnaireSubmission, Project]),
    PaymentsModule,
  ],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
  exports: [QuestionnaireService],
})
export class IntakeModule {}
