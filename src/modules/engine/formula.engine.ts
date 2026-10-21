import { Injectable } from '@nestjs/common';

@Injectable()
export class FormulaEngine {
  evaluateExpression(expression: string, context: Record<string, number>): number | null {
    if (!expression || expression.trim() === '') return null;

    try {
      // Normalize common column name aliases
      let expr = expression
        .replace(/Y\s*\(\s*1\s*\)\s*\/\s*N\s*\(\s*0\s*\)/gi, 'Y_1__N_0_')
        .replace(/Weight\s*\(\s*1\s*-\s*4\s*\)/gi, 'Weight_1_4_')
        .replace(/Highest\s+Score/gi, 'Highest_Score');

      const keys = ['IF', 'MIN', 'MAX', 'ROUND', ...Object.keys(context)];
      const values = [
        (c: any, a: any, b: any) => (c ? a : b),
        Math.min,
        Math.max,
        Math.round,
        ...Object.values(context),
      ];
      const fn = new Function(...keys, `return Number(${expr});`);
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
