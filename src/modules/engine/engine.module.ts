import { Module } from '@nestjs/common';
import { ConditionalRuleEngine } from './conditional-rule.engine';
import { ScoringEngine } from './scoring.engine';
import { FormulaEngine } from './formula.engine';

@Module({
  providers: [ConditionalRuleEngine, ScoringEngine, FormulaEngine],
  exports: [ConditionalRuleEngine, ScoringEngine, FormulaEngine],
})
export class EngineModule {}
