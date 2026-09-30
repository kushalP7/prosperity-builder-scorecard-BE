import { Injectable } from '@nestjs/common';

export enum RuleOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals',
  BETWEEN = 'between',
}

export interface RuleDefinition {
  ifColumnId: string;
  operator: RuleOperator;
  conditionValue: any;
  resultValue: any;
}

@Injectable()
export class ConditionalRuleEngine {
  evaluateRules(rules: RuleDefinition[], rowData: Record<string, any>): any | undefined {
    if (!rules || rules.length === 0) return undefined;

    for (const rule of rules) {
      const sourceRecord = rowData[rule.ifColumnId];
      const sourceValue = sourceRecord?.value;

      if (sourceValue === null || sourceValue === undefined || sourceValue === '') continue;

      let matched = false;
      const condVal = rule.conditionValue;

      switch (rule.operator) {
        case RuleOperator.EQUALS:
          matched = String(sourceValue) === String(condVal);
          break;
        case RuleOperator.NOT_EQUALS:
          matched = String(sourceValue) !== String(condVal);
          break;
        case RuleOperator.GREATER_THAN:
          matched = Number(sourceValue) > Number(condVal);
          break;
        case RuleOperator.LESS_THAN:
          matched = Number(sourceValue) < Number(condVal);
          break;
        case RuleOperator.GREATER_THAN_OR_EQUALS:
          matched = Number(sourceValue) >= Number(condVal);
          break;
        case RuleOperator.LESS_THAN_OR_EQUALS:
          matched = Number(sourceValue) <= Number(condVal);
          break;
        case RuleOperator.BETWEEN:
          if (Array.isArray(condVal) && condVal.length === 2) {
            matched = Number(sourceValue) >= condVal[0] && Number(sourceValue) <= condVal[1];
          }
          break;
      }

      if (matched) {
        return rule.resultValue;
      }
    }

    return undefined;
  }
}
