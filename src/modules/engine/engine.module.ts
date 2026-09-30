import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScorecardRollup } from './entities/scorecard-rollup.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectDataRecord } from '../projects/entities/project-data-record.entity';
import { QuestionnaireSubmission } from '../intake/entities/questionnaire-submission.entity';
import { ExternalDataStaging } from '../ingestion/entities/external-data-staging.entity';
import { ScoringEngine } from './scoring.engine';
import { FormulaEngine } from './formula.engine';
import { CalculatorService } from './calculator.service';
import { CalibrationController } from './calibration.controller';
import { PaymentsModule } from '../payments/payments.module';

import { ScorecardCalcService } from './scorecard-calc.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ScorecardRollup,
      Project,
      ProjectDataRecord,
      QuestionnaireSubmission,
      ExternalDataStaging,
    ]),
    PaymentsModule,
  ],
  controllers: [CalibrationController],
  providers: [CalculatorService, ScoringEngine, FormulaEngine, ScorecardCalcService],
  exports: [CalculatorService, ScoringEngine, FormulaEngine, ScorecardCalcService],
})
export class EngineModule {}
