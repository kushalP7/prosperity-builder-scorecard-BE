import { Injectable } from '@nestjs/common';

@Injectable()
export class FormulaEngine {
  evaluateExpression(expression: string, context: Record<string, number>): number | null {
    if (!expression || expression.trim() === '') return null;

    try {
      const keys = Object.keys(context);
      const values = Object.values(context);
      const fn = new Function(...keys, `return Number(${expression});`);
      const result = fn(...values);

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return null;
      }
      return Number(result.toFixed(2));
    } catch {
      return null;
    }
  }
}
