import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoringEngine {
  computeScore(scoringRule: any, value: any, scoreValue?: number): number {
    if (!scoringRule) return 0;

    switch (scoringRule.kind) {
      case 'manual':
        const rawScore = scoreValue !== undefined && scoreValue !== null ? scoreValue : Number(value) || 0;
        return Math.min(Math.max(0, rawScore), scoringRule.maxPoints || 10);

      case 'threshold':
        const numVal = Number(value) || 0;
        if (scoringRule.direction === 'above' && numVal >= scoringRule.threshold) return scoringRule.points;
        if (scoringRule.direction === 'below' && numVal <= scoringRule.threshold) return scoringRule.points;
        return 0;

      case 'benchmark_range':
        const bVal = Number(value) || 0;
        for (const range of scoringRule.ranges || []) {
          const minOk = range.min === null || range.min === undefined || bVal >= range.min;
          const maxOk = range.max === null || range.max === undefined || bVal <= range.max;
          if (minOk && maxOk) return range.points;
        }
        return 0;

      case 'boolean':
        const boolVal = value === true || value === 'true' || value === 1 || value === '1';
        return boolVal ? scoringRule.truePoints : scoringRule.falsePoints;

      default:
        return 0;
    }
  }
}
