import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuestionnaireSubmission } from './entities/questionnaire-submission.entity';
import { Project } from '../projects/entities/project.entity';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    SequelizeModule.forFeature([QuestionnaireSubmission, Project]),
    PaymentsModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
  exports: [QuestionnaireService],
})
export class IntakeModule {}
