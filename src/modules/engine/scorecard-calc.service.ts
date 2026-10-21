import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../projects/entities/project.entity';
import { ProjectDataRecord } from '../projects/entities/project-data-record.entity';
import { ScorecardRollup } from './entities/scorecard-rollup.entity';
import { SCORECARD_CATEGORIES } from './calculator.service';
import { FormulaEngine } from './formula.engine';

export interface CalculatedRowResult {
  yn: number | null;
  weight: number;
  value: number | null;
  clientTotal: number;
  highest: number;
  trend: number;
  customTargets?: Record<string, number>;
  notes?: string;
  matchedValueTarget?: boolean;
}

@Injectable()
export class ScorecardCalcService {
  private readonly logger = new Logger(ScorecardCalcService.name);

  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(ProjectDataRecord) private recordModel: typeof ProjectDataRecord,
    @InjectModel(ScorecardRollup) private rollupModel: typeof ScorecardRollup,
    private formulaEngine: FormulaEngine,
  ) { }

  /**
   * Evaluates an individual row's score metrics based on label, raw base value, and methodology.
   * Supports dynamic scoringRules from node if configured, with fallback to standard methodology.
   */
  evaluateRow(
    nodeOrLabel: string | any,
    rawDataVal: any,
    rowRecordsLookup?: (colIdOrName: string) => any,
    columns?: any[]
  ): CalculatedRowResult {
    const label = (typeof nodeOrLabel === 'string' ? nodeOrLabel : (nodeOrLabel?.label || '')).toLowerCase().trim();
    let numVal = typeof rawDataVal === 'number' ? rawDataVal : Number(rawDataVal);
    const isNumeric = !isNaN(numVal) && rawDataVal !== null && rawDataVal !== '' && rawDataVal !== undefined;
    const isBoolTrue = rawDataVal === true || rawDataVal === 'true' || rawDataVal === 1 || rawDataVal === '1' || (typeof rawDataVal === 'string' && rawDataVal.toLowerCase() === 'yes');

    // ==========================================
    // 0. Dynamic Row Rules (Configured in Section Maker)
    // ==========================================
    if (typeof nodeOrLabel === 'object' && nodeOrLabel !== null) {
      const dynamicRules = nodeOrLabel.scoringRules;
      if (Array.isArray(dynamicRules) && dynamicRules.length > 0) {
        const rowWeight = Number(nodeOrLabel.weight) > 0 ? Number(nodeOrLabel.weight) : 2;
        let matchedValue: number | null = null;
        let matchedYn: number | null = null;
        let matchedHighest: number | null = null;
        const matchedCustomTargets: Record<string, number> = {};

        for (const rule of dynamicRules) {
          const ifColId = rule.ifColumnId || '__base__';
          let sourceVal = rawDataVal;
          if (ifColId !== '__base__' && ifColId !== 'Data' && ifColId !== 'data' && rowRecordsLookup) {
            const fetched = rowRecordsLookup(ifColId);
            if (fetched !== undefined && fetched !== null && fetched !== '') {
              sourceVal = fetched;
            } else {
              sourceVal = null;
            }
          }

          if (sourceVal === null || sourceVal === undefined || sourceVal === '') {
            continue;
          }

          let ruleNumVal = typeof sourceVal === 'number' ? sourceVal : Number(sourceVal);
          const ruleIsNumeric = !isNaN(ruleNumVal);
          const op = rule.operator;
          const cond = rule.conditionValue;
          const res = Number(rule.resultValue);

          // Numerical value for comparison (Census API and user inputs are already on the 0-100 percentage scale)
          let compVal = ruleNumVal;

          let matched = false;
          if (op === 'equals') {
            if (ruleIsNumeric && compVal === Number(cond)) matched = true;
            else if (String(sourceVal).trim().toLowerCase() === String(cond).trim().toLowerCase()) matched = true;
          } else if (op === 'not_equals') {
            if (ruleIsNumeric && compVal !== Number(cond)) matched = true;
            else if (String(sourceVal).trim().toLowerCase() !== String(cond).trim().toLowerCase()) matched = true;
          } else if (op === 'greater_than' && ruleIsNumeric && compVal > Number(cond)) {
            matched = true;
          } else if (op === 'greater_than_or_equals' && ruleIsNumeric && compVal >= Number(cond)) {
            matched = true;
          } else if (op === 'less_than' && ruleIsNumeric && compVal < Number(cond)) {
            matched = true;
          } else if (op === 'less_than_or_equals' && ruleIsNumeric && compVal <= Number(cond)) {
            matched = true;
          } else if (op === 'between' && ruleIsNumeric) {
            const min = Array.isArray(cond) ? Number(cond[0]) : 0;
            const max = Array.isArray(cond) ? Number(cond[1]) : 0;
            if (compVal >= min && compVal <= max) {
              matched = true;
            }
          }

          if (matched) {
            const targetId = rule.targetColumnId;
            let targetColName = '';
            if (targetId && columns && Array.isArray(columns)) {
              const found = columns.find(c => c.id === targetId || c.name?.trim().toLowerCase() === targetId.trim().toLowerCase());
              if (found) targetColName = (found.name || '').toLowerCase();
            }

            const isYn = targetId === '__yn__' || /y\s*\(?1\)?\s*\/\s*n|y_1/i.test(targetColName || targetId || '');
            const isHighest = targetId === '__highest__' || /highest/i.test(targetColName || targetId || '');
            const isVal = !targetId || targetId === '__value__' || (targetColName && targetColName.trim() === 'value') || (!targetColName && /value/i.test(targetId || ''));

            if (isYn) {
              if (matchedYn === null) matchedYn = res;
            } else if (isHighest) {
              if (matchedHighest === null) matchedHighest = res;
            } else if (isVal) {
              if (matchedValue === null) matchedValue = res;
            } else if (targetId) {
              if (matchedCustomTargets[targetId] === undefined) matchedCustomTargets[targetId] = res;
            }
          }
        }

        if (matchedValue !== null || matchedYn !== null || matchedHighest !== null || Object.keys(matchedCustomTargets).length > 0) {
          let finalVal: number | null = null;
          let matchedValueTarget = false;
          if (matchedValue !== null) {
            finalVal = matchedValue;
            matchedValueTarget = true;
          } else if (rowRecordsLookup) {
            const existingVal = rowRecordsLookup('Value');
            if (existingVal !== undefined && existingVal !== null && existingVal !== '') {
              const num = Number(existingVal);
              finalVal = isNaN(num) ? null : num;
            }
          }

          const isBooleanNode = nodeOrLabel?.scoringType === 'boolean';
          const effectiveVal = isBooleanNode
            ? (matchedYn !== null ? matchedYn : (finalVal !== null ? finalVal : 0))
            : (finalVal !== null ? finalVal : (matchedYn !== null ? matchedYn : 0));
          const valForCalc = effectiveVal;
          const rowHighest = matchedHighest !== null
            ? matchedHighest
            : (Number(nodeOrLabel.highestScore) > 0 ? Number(nodeOrLabel.highestScore) : (rowWeight * Math.max(1, valForCalc)));
          const clientTotal = Math.min(rowHighest, valForCalc * rowWeight);

          // Check if this row is a presence / binary amenity metric
          const isPresenceMetric =
            label.includes('airport') ||
            label.includes('train') ||
            label.includes('transit') ||
            label.includes('bus') ||
            label.includes('rideshare') ||
            label.includes('trolley') ||
            label.includes('bike') ||
            label.includes('pedestrian') ||
            label.includes('public art map') ||
            label.includes('community center') ||
            label.includes('museum') ||
            label.includes('theatre') ||
            label.includes('theater') ||
            label.includes('event venue') ||
            label.includes('y(1)') ||
            label.includes('y_1');

          const ynVal = matchedYn !== null
            ? matchedYn
            : (isPresenceMetric ? (valForCalc > 0 || isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0) : null);

          return {
            yn: ynVal,
            weight: rowWeight,
            value: finalVal,
            clientTotal,
            highest: rowHighest,
            trend: 10,
            customTargets: matchedCustomTargets,
            matchedValueTarget,
            notes: `Calculated from custom rule: ${rawDataVal ?? 'None'}`,
          };
        }
      }
    }

    // Default fallbacks
    let w = typeof nodeOrLabel === 'object' && Number(nodeOrLabel?.weight) > 0 ? Number(nodeOrLabel.weight) : 2;
    let h = typeof nodeOrLabel === 'object' && Number(nodeOrLabel?.highestScore) > 0 ? Number(nodeOrLabel.highestScore) : 4;
    let yn: number | null = null;
    let val: number | null = null;
    let notes = '';

    if (rowRecordsLookup) {
      const existingVal = rowRecordsLookup('Value');
      if (existingVal !== undefined && existingVal !== null && existingVal !== '') {
        const num = Number(existingVal);
        val = isNaN(num) ? null : num;
      }
    }

    // ==========================================
    // 1. Accessibility & Transportation
    // ==========================================
    if (label.includes('interstate')) {
      // *Interstate If 'Data' None = 0; 1-2 = 1; >2 = 2
      w = 4; h = 8;
      const count = isNumeric ? numVal : 0;
      val = count === 0 ? 0 : count <= 2 ? 1 : 2;
      notes = `Interstate Routes: ${count} (${val === 2 ? '>2' : val === 1 ? '1-2' : 'None'})`;
    } else if (label.includes('us highway')) {
      // US Highway If 'Data' 0-1 = 0; 1-3 = 1; >3 = 2
      w = 3; h = 6;
      const count = isNumeric ? numVal : 0;
      val = count <= 1 ? 0 : count <= 3 ? 1 : 2;
      notes = `US Highway Corridors: ${count}`;
    } else if (label.includes('state highway')) {
      // State Highway If 'Data' 0-1 = 0; 1-3 = 1; >3 = 2
      w = 2; h = 4;
      const count = isNumeric ? numVal : 0;
      val = count <= 1 ? 0 : count <= 3 ? 1 : 2;
      notes = `NC State Highways: ${count}`;
    } else if (label.includes('w/o vehicle') || label.includes('without vehicle')) {
      w = 3; h = 9;
      // Lower is better (national avg ~8%)
      const pct = isNumeric ? numVal : 4.0;
      val = pct <= 4.0 ? 3 : pct <= 8.0 ? 2 : 1;
      notes = `Households without vehicle: ${pct}%`;
    } else if (label.includes('commute time')) {
      w = 3; h = 12;
      // National avg 26.7 min
      const mins = isNumeric ? numVal : 24.1;
      val = mins <= 22 ? 4 : mins <= 26.7 ? 3 : mins <= 32 ? 2 : 1;
      notes = `Average commute time: ${mins} min`;
    } else if (label.includes('airport')) {
      w = 4; h = 4; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
      notes = yn ? 'Commercial/Regional airport available within 30-45 min' : 'No regional airport';
    } else if (label.includes('train')) {
      w = 4; h = 4; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
      notes = yn ? 'Passenger rail/Amtrak service available' : 'No direct rail service';
    } else if (label.includes('rapid bus')) {
      w = 4; h = 4; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('city bus')) {
      w = 3; h = 3; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
      notes = yn ? 'Municipal fixed-route transit in operation' : 'No fixed-route municipal transit';
    } else if (label.includes('trolley')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('rideshare') || label.includes('micro transit')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('stip') || label.includes('state transportation funds')) {
      w = 4; h = 8;
      const count = isNumeric ? numVal : 0;
      val = count >= 5 ? 2 : count >= 1 ? 1 : 0;
      notes = `NCDOT STIP scheduled/funded projects: ${count}`;
    } else if (label.includes('bike and ped') || label.includes('pedestrian plan')) {
      w = 3; h = 3; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
      notes = yn ? 'Adopted Comprehensive Bicycle & Pedestrian Plan' : 'No active bike/ped plan';
    }

    // ==========================================
    // 2. Arts & Culture
    // ==========================================
    else if (label.includes('public art if') || label.includes('public art install')) {
      w = 3; h = 6;
      const count = isNumeric ? numVal : 0;
      val = count === 0 ? 0 : count <= 5 ? 1 : 2;
    } else if (label.includes('murals')) {
      w = 2; h = 4;
      const count = isNumeric ? numVal : 0;
      val = count === 0 ? 0 : count <= 5 ? 1 : 2;
    } else if (label.includes('public art map')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('arts/community center') || label.includes('community center')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('museum')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('theatre') || label.includes('theater')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('event venues')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('event programs') || label.includes('festivals')) {
      w = 4; h = 12;
      const count = isNumeric ? numVal : 0;
      val = count >= 6 ? 3 : count >= 3 ? 2 : count >= 1 ? 1 : 0;
    } else if (label.includes('arts, entertainment sector') || label.includes('arts, entertainment')) {
      w = 4; h = 8;
      const pct = isNumeric ? numVal : 2.6;
      val = pct >= 3.5 ? 2 : pct >= 1.5 ? 1 : 0;
    }

    // ==========================================
    // 3. Crime & Public Safety
    // ==========================================
    else if (label.includes('personal crime')) {
      w = 4; h = 16;
      const idx = isNumeric ? numVal : 74;
      val = idx < 65 ? 4 : idx <= 80 ? 3 : idx <= 100 ? 2 : 1;
      notes = `ESRI Personal Crime Index: ${idx} (US Avg = 100)`;
    } else if (label.includes('property crime')) {
      w = 3; h = 12;
      const idx = isNumeric ? numVal : 82;
      val = idx < 70 ? 4 : idx <= 85 ? 3 : idx <= 100 ? 2 : 1;
      notes = `ESRI Property Crime Index: ${idx} (US Avg = 100)`;
    } else if (label.includes('officer to resident') || label.includes('national standard')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
      notes = yn ? 'Meets national staffing standard (2.8/1k)' : 'Below benchmark ratio';
    }

    // ==========================================
    // 4. Education
    // ==========================================
    else if (label.includes('hs graduation') || label.includes('high school grad')) {
      w = 2; h = 2;
      const rate = isNumeric ? numVal : 88.4;
      val = rate >= 85 ? 1 : 0;
      notes = `Graduation rate: ${rate}%`;
    } else if (label.includes('some college')) {
      w = 2; h = 2; val = 1;
    } else if (label.includes('associates degree')) {
      w = 3; h = 3; val = 1;
    } else if (label.includes('bachelor degree') || label.includes('bachelor')) {
      w = 4; h = 4;
      const pct = isNumeric ? numVal : 21.0;
      val = pct >= 20 ? 1 : 0;
      notes = `Bachelor attainment: ${pct}%`;
    } else if (label.includes('graduate/phd')) {
      w = 4; h = 4; val = 1;
    } else if (label.includes('k-12 performance') || label.includes('low performing')) {
      w = 4; h = 16;
      const low = isNumeric ? numVal : 1;
      val = low === 0 ? 4 : low <= 2 ? 3 : low <= 4 ? 2 : 1;
    } else if (label.includes('chronic absentism') || label.includes('absenteeism')) {
      w = 3; h = 12;
      const abs = isNumeric ? numVal : 18;
      val = abs < 15 ? 4 : abs <= 22 ? 3 : 2;
    } else if (label.includes('community college') || label.includes('trade school')) {
      w = 3; h = 6;
      const count = isNumeric ? numVal : 1;
      val = count >= 2 ? 2 : count >= 1 ? 1 : 0;
    } else if (label.includes('college/universities') || label.includes('universities')) {
      w = 4; h = 8;
      const count = isNumeric ? numVal : 1;
      val = count >= 2 ? 2 : count >= 1 ? 1 : 0;
    }

    // ==========================================
    // 5. Employment & Labor
    // ==========================================
    else if (label.includes('white collar')) {
      w = 3; h = 6; val = isNumeric && numVal >= 50 ? 2 : 1;
    } else if (label.includes('blue collar')) {
      w = 3; h = 6; val = 1;
    } else if (label.includes('services employed')) {
      w = 2; h = 4; val = 1;
    } else if (label.includes('unemployment rate')) {
      w = 3; h = 9;
      const rate = isNumeric ? numVal : 3.3;
      val = rate <= 3.5 ? 3 : rate <= 4.5 ? 2 : 1;
      notes = `BLS LAUS Unemployment: ${rate}%`;
    } else if (label.includes('labor participation')) {
      w = 4; h = 16;
      const part = isNumeric ? numVal : 60.5;
      val = part >= 62 ? 4 : part >= 58 ? 3 : part >= 54 ? 2 : 1;
      notes = `Labor participation: ${part}%`;
    } else if (label.includes('average hh income')) {
      w = 2; h = 8;
      const inc = isNumeric ? numVal : 77283;
      val = inc >= 75000 ? 4 : inc >= 60000 ? 3 : 2;
    } else if (label.includes('median hh income')) {
      w = 3; h = 12;
      const inc = isNumeric ? numVal : 60941;
      val = inc >= 65000 ? 4 : inc >= 55000 ? 3 : inc >= 45000 ? 2 : 1;
      notes = `US Census ACS Median HH Income: $${inc.toLocaleString()}`;
    } else if (label.includes('per capita income')) {
      w = 3; h = 12;
      const inc = isNumeric ? numVal : 30083;
      val = inc >= 35000 ? 4 : inc >= 28000 ? 3 : 2;
    } else if (label.includes('pad ready')) {
      w = 3; h = 6;
      const sites = isNumeric ? numVal : 1;
      val = sites >= 2 ? 2 : sites >= 1 ? 1 : 0;
    } else if (label.includes('buildings > 5000')) {
      w = 2; h = 4;
      const bldgs = isNumeric ? numVal : 2;
      val = bldgs >= 2 ? 2 : bldgs >= 1 ? 1 : 0;
    } else if (label.includes('500+ employee')) {
      w = 3; h = 12;
      const c = isNumeric ? numVal : 3;
      val = c >= 3 ? 4 : c >= 1 ? 3 : 1;
    } else if (label.includes('1000+ employee')) {
      w = 4; h = 16;
      const c = isNumeric ? numVal : 1;
      val = c >= 2 ? 4 : c >= 1 ? 3 : 1;
    } else if (label.includes('bonus: hq/fortune')) {
      w = 4; h = 4; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    }

    // ==========================================
    // 6. Goods & Services
    // ==========================================
    else if (label.includes('retail trade')) {
      w = 3; h = 6; val = isNumeric && numVal >= 2 ? 2 : 1;
    } else if (label.includes('accommodations') || label.includes('food services')) {
      w = 3; h = 6; val = 1;
    } else if (label.includes('retail vacancy')) {
      w = 4; h = 16;
      const vac = isNumeric ? numVal : 8.5;
      val = vac <= 8 ? 4 : vac <= 12 ? 3 : 2;
    }

    // ==========================================
    // 7. Healthcare & Wellness
    // ==========================================
    else if (label.includes('beds per 1,000') || label.includes('hospitals')) {
      w = 4; h = 4;
      const beds = isNumeric ? numVal : 2.7;
      val = beds >= 2.5 ? 1 : 0;
    } else if (label.includes('clinics') || label.includes('medical facilities')) {
      w = 3; h = 6;
      const c = isNumeric ? numVal : 2;
      val = c >= 2 ? 2 : c >= 1 ? 1 : 0;
    } else if (label.includes('county health factors')) {
      w = 3; h = 12;
      val = 3;
    } else if (label.includes('air quality index') || label.includes('air quality')) {
      w = 2; h = 8;
      const pct = isNumeric ? numVal : 92.4;
      val = pct >= 90 ? 4 : pct >= 80 ? 3 : 2;
      notes = `EPA AQS Air Quality Good Days: ${pct}%`;
    } else if (label.includes('below poverty level') || label.includes('poverty')) {
      w = 4; h = 16;
      const pov = isNumeric ? numVal : 13.3;
      val = pov < 12 ? 4 : pov <= 16 ? 3 : pov <= 20 ? 2 : 1;
      notes = `ACS Poverty Rate: ${pov}%`;
    } else if (label.includes('healthy food')) {
      w = 3; h = 6; val = 2;
    } else if (label.includes('healthcare sector')) {
      w = 3; h = 6; val = 1;
    }

    // ==========================================
    // 8. Historic Preservation
    // ==========================================
    else if (label.includes('historic districts')) {
      w = 3; h = 6;
      const c = isNumeric ? numVal : 2;
      val = c >= 2 ? 2 : c >= 1 ? 1 : 0;
    } else if (label.includes('main st. designation')) {
      w = 3; h = 3; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('main st. manager') || label.includes('downtown manager')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('registered buildings')) {
      w = 1; h = 2;
      const c = isNumeric ? numVal : 12;
      val = c >= 10 ? 2 : c >= 1 ? 1 : 0;
    } else if (label.includes('business improvement district') || label.includes('municipal service')) {
      w = 1; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('historic tour map')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    }

    // ==========================================
    // 9. Housing
    // ==========================================
    else if (label.includes('renter occupied')) {
      w = 3; h = 12;
      const pct = isNumeric ? numVal : 34.7;
      val = pct >= 25 && pct <= 45 ? 4 : 3;
    } else if (label.includes('median home value')) {
      w = 3; h = 12;
      const val$ = isNumeric ? numVal : 186000;
      val = val$ >= 220000 ? 4 : val$ >= 170000 ? 3 : val$ >= 130000 ? 2 : 1;
      notes = `Median Home Value: $${val$.toLocaleString()}`;
    } else if (label.includes('median rent')) {
      w = 3; h = 12;
      const rent = isNumeric ? numVal : 923;
      val = rent >= 800 && rent <= 1250 ? 4 : 3;
    } else if (label.includes('structure year built')) {
      w = 3; h = 12; val = 3;
    } else if (label.includes('cost burdened')) {
      w = 4; h = 12; val = 2;
    } else if (label.includes('diversity index')) {
      w = 3; h = 3; val = 1;
    }

    // ==========================================
    // 10. Infrastructure
    // ==========================================
    else if (label.includes('sewer capacity')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('water capacity')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('electric capacity')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('broadband')) {
      w = 2; h = 8;
      const pct = isNumeric ? numVal : 91.5;
      val = pct >= 95 ? 4 : pct >= 85 ? 3 : 2;
    } else if (label.includes('expansion plans')) {
      w = 3; h = 3; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('roadways (stip)')) {
      w = 1; h = 4;
      const c = isNumeric ? numVal : 9;
      val = c >= 5 ? 4 : c >= 2 ? 3 : 2;
    } else if (label.includes('water quality') || label.includes('stormwater')) {
      w = 2; h = 8; val = 3;
    } else if (label.includes('emergency planning')) {
      w = 1; h = 1; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('green energy')) {
      w = 3; h = 3; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    }

    // ==========================================
    // 11. Open Space & Recreation
    // ==========================================
    else if (label.includes('recreation plan')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('parks and rec director')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('greenway')) {
      w = 3; h = 9;
      const miles = isNumeric ? numVal : 6;
      val = miles >= 10 ? 3 : miles >= 3 ? 2 : miles >= 1 ? 1 : 0;
    } else if (label.includes('natural/recreational assets')) {
      w = 2; h = 6;
      const c = isNumeric ? numVal : 2;
      val = c >= 3 ? 3 : c >= 1 ? 2 : 0;
    } else if (label.includes('open space/parks')) {
      w = 3; h = 9;
      const c = isNumeric ? numVal : 5;
      val = c >= 5 ? 3 : c >= 2 ? 2 : 1;
    } else if (label.includes('conservation ordinances')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('national (2) or state park')) {
      w = 3; h = 3; val = 1;
    }

    // ==========================================
    // 12. Planning & Land Use
    // ==========================================
    else if (label.includes('agricultural districts') || label.includes('vad')) {
      w = 2; h = 2; yn = isBoolTrue || (isNumeric && numVal > 0) ? 1 : 0;
      val = yn;
    } else if (label.includes('agricultural employment')) {
      w = 2; h = 4; val = 1;
    } else if (label.includes('residential property tax')) {
      w = 3; h = 6; val = 2;
    } else if (label.includes('commercial property tax')) {
      w = 3; h = 6; val = 2;
    } else if (label.includes('vacant land')) {
      w = 3; h = 6; val = 2;
    } else if (label.includes('tax exempt acreage')) {
      w = 2; h = 4; val = 2;
    } else if (label.includes('comprehensive land use plan')) {
      w = 4; h = 12;
      val = isBoolTrue || (isNumeric && numVal > 0) ? 3 : 2;
    } else {
      // Generic fallback: if boolean, use yn=1; if number, normalize to max
      if (isBoolTrue) {
        yn = 1;
        val = 1;
      } else if (isNumeric) {
        const maxValAllowed = Math.max(1, Math.round(h / w));
        val = Math.min(maxValAllowed, Math.max(0, Math.round(numVal / (100 / maxValAllowed))));
      }
    }

    const valForCalc = val !== null ? val : 0;
    const clientTotal = yn !== null ? Math.min(h, yn * w) : Math.min(h, valForCalc * w);
    const trend = Math.min(18, Math.max(5, Math.round(6 + clientTotal * 0.7)));

    return {
      yn,
      weight: w,
      value: val,
      clientTotal,
      highest: h,
      trend,
      notes,
    };
  }

  /**
   * Recalculates all custom columns across all sections of a project,
   * stores results in project_data_records, and updates the scorecard rollup.
   */
  async calculateAllRowsForProject(projectId: string): Promise<{ calculatedRows: number; overallScore: number }> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) return { calculatedRows: 0, overallScore: 0 };

    const assignedSections = project.assignedSections || [];
    if (assignedSections.length === 0) {
      await this.rollupModel.upsert({
        projectId,
        overallScoreTenScale: 0,
        overallScorePercentage: 0,
        performanceBand: 'Average',
        categoryScores: [],
      });
      return { calculatedRows: 0, overallScore: 0 };
    }

    const allRecords = await this.recordModel.findAll({ where: { projectId } });
    const recordsMap = new Map<string, ProjectDataRecord>();
    for (const r of allRecords) {
      recordsMap.set(`${r.nodeId}:${r.columnId}`, r);
    }

    let calculatedRows = 0;
    const recordsToUpsert: any[] = [];
    const categoryAccumulator: Record<string, { clientTotal: number; highestTotal: number }> = {};

    for (const section of assignedSections) {
      const sectionTitle = section.label || section.title || '';
      const catKey = sectionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!categoryAccumulator[catKey]) {
        categoryAccumulator[catKey] = { clientTotal: 0, highestTotal: 0 };
      }

      for (const cat of section.categories || []) {
        const columns = (section.columns && section.columns.length > 0) ? section.columns : (cat.columns || []);
        const ynCol = columns.find((c: any) =>
          c.name === 'Y(1)/N(0)' || /y\s*\(?1\)?\s*\/\s*n/i.test(c.name || '') || /^(y_n|yn|yes_no)$/i.test(c.name || '')
        );
        const wCol = columns.find((c: any) => /weight/i.test(c.name || ''));
        const valCol = columns.find((c: any) =>
          c.name === 'Value' || /^(value|raw_value|metric_value|val)$/i.test(c.name?.trim() || '')
        );
        const clientCol = columns.find((c: any) =>
          /client.*total/i.test(c.name || '') || /total.*score/i.test(c.name || '') || (c.type === 'formula' && c.formulaExpression)
        );
        const highestCol = columns.find((c: any) => /highest/i.test(c.name || ''));
        const trendCol = columns.find((c: any) => /trend/i.test(c.name || ''));
        const notesCol = columns.find((c: any) => /notes/i.test(c.name || ''));

        const nodes = cat.groups && cat.groups.length > 0 ? cat.groups : [cat];

        for (const node of nodes) {
          const baseRec = recordsMap.get(`${node.id}:__base__`);
          const baseVal = baseRec?.value;

          const rowRecordsLookup = (colIdOrName: string) => {
            const byId = recordsMap.get(`${node.id}:${colIdOrName}`);
            if (byId && byId.value !== undefined && byId.value !== null) return byId.value;
            const matchedCol = columns.find(
              (c: any) => c.id === colIdOrName || c.name?.trim().toLowerCase() === colIdOrName.trim().toLowerCase(),
            );
            if (matchedCol) {
              const byName = recordsMap.get(`${node.id}:${matchedCol.id}`);
              if (byName && byName.value !== undefined && byName.value !== null) return byName.value;
            }
            return undefined;
          };

          const evaluated = this.evaluateRow(node, baseVal, rowRecordsLookup, columns);
          calculatedRows++;

          // If evaluated.yn is null, preserve existing Y/N value if user had entered or seeded one
          const existingYnRec = ynCol ? recordsMap.get(`${node.id}:${ynCol.id}`) : null;
          const finalYn = evaluated.yn !== null
            ? evaluated.yn
            : (existingYnRec && existingYnRec.value !== null && existingYnRec.value !== undefined ? Number(existingYnRec.value) : null);

          // Determine effective score for this row based on scoringType (boolean vs value)
          const isBooleanType = node.scoringType === 'boolean' || (node.scoringType !== 'value' && finalYn !== null && (evaluated.value === null || evaluated.value === undefined));
          const effectiveScore = isBooleanType ? (finalYn !== null ? finalYn : 0) : (evaluated.value ?? (finalYn ?? 0));

          // Build dynamic rowContext for formula evaluation
          const rowContext: Record<string, number> = {
            data: typeof baseVal === 'number' ? baseVal : Number(baseVal) || 0,
            Data: typeof baseVal === 'number' ? baseVal : Number(baseVal) || 0,
            Value: effectiveScore,
            value: effectiveScore,
            Weight: evaluated.weight,
            weight: evaluated.weight,
            Weight__1_4_: evaluated.weight,
            Weight_1_4_: evaluated.weight,
            Y_1__N_0_: finalYn !== null ? finalYn : 0,
            Highest_Score: evaluated.highest,
            Highest: evaluated.highest,
            trend: evaluated.trend,
            Trend: evaluated.trend,
          };

          // Also include existing records or default values for all other columns in this row
          for (const c of columns) {
            const rec = recordsMap.get(`${node.id}:${c.id}`);
            const safeName = c.name?.replace(/[^a-zA-Z0-9_]/g, '_');
            const colDefVal = node.columnDefaults?.[c.id] ?? node.columnDefaults?.[c.name];
            let valToUse = rec && typeof rec.value === 'number' ? rec.value : undefined;
            if (valToUse === undefined && colDefVal !== undefined && colDefVal !== null) {
              const numDef = Number(colDefVal);
              if (!isNaN(numDef)) valToUse = numDef;
            }
            if (safeName && valToUse !== undefined && !isNaN(valToUse)) {
              rowContext[safeName] = valToUse;
            }
          }

          // Dynamic evaluation: Priority 1 is row's own formula (if set), Priority 2 is clientCol's formula
          const rowFormula = (node.formula && node.formula.trim()) ? node.formula.trim() : null;
          const colFormula = (clientCol && (clientCol.type === 'formula' || clientCol.formulaExpression)) ? clientCol.formulaExpression?.trim() : null;
          const exprToEvaluate = rowFormula || colFormula;

          if (exprToEvaluate) {
            const dynVal = this.formulaEngine.evaluateExpression(exprToEvaluate, rowContext);
            if (dynVal !== null) {
              evaluated.clientTotal = dynVal;
            }
          }

          // Also evaluate any other custom formula columns
          const otherFormulaCols = columns.filter((c: any) =>
            (c.type === 'formula' || (c.formulaExpression && c.formulaExpression.trim())) &&
            (!clientCol || c.id !== clientCol.id)
          );

          for (const fCol of otherFormulaCols) {
            const fVal = this.formulaEngine.evaluateExpression(fCol.formulaExpression, rowContext);
            if (fVal !== null) {
              const safeName = fCol.name?.replace(/[^a-zA-Z0-9_]/g, '_');
              if (safeName) rowContext[safeName] = fVal;
              recordsToUpsert.push({
                projectId,
                nodeId: node.id,
                columnId: fCol.id,
                value: fVal,
                scoreValue: fVal,
              });
            }
          }

          categoryAccumulator[catKey].clientTotal += evaluated.clientTotal;
          categoryAccumulator[catKey].highestTotal += evaluated.highest;

          if (ynCol) {
            recordsToUpsert.push({
              projectId,
              nodeId: node.id,
              columnId: ynCol.id,
              value: finalYn,
              scoreValue: finalYn !== null ? finalYn : 0,
            });
          }
          if (wCol) {
            recordsToUpsert.push({
              projectId,
              nodeId: node.id,
              columnId: wCol.id,
              value: evaluated.weight,
              scoreValue: evaluated.weight,
            });
          }
          const existingValRec = valCol ? recordsMap.get(`${node.id}:${valCol.id}`) : null;
          let finalVal = evaluated.value;
          if (finalVal === null && existingValRec && existingValRec.value !== null && existingValRec.value !== undefined && existingValRec.value !== '') {
            finalVal = Number(existingValRec.value);
          }

          if (valCol && (evaluated.matchedValueTarget || finalVal !== null)) {
            recordsToUpsert.push({
              projectId,
              nodeId: node.id,
              columnId: valCol.id,
              value: finalVal,
              scoreValue: finalVal !== null ? finalVal : 0,
            });
          }
          if (clientCol) {
            recordsToUpsert.push({
              projectId,
              nodeId: node.id,
              columnId: clientCol.id,
              value: evaluated.clientTotal,
              scoreValue: evaluated.clientTotal,
            });
          }
          if (highestCol) {
            recordsToUpsert.push({
              projectId,
              nodeId: node.id,
              columnId: highestCol.id,
              value: evaluated.highest,
              scoreValue: evaluated.highest,
            });
          }
          if (trendCol) {
            recordsToUpsert.push({
              projectId,
              nodeId: node.id,
              columnId: trendCol.id,
              value: evaluated.trend,
              scoreValue: evaluated.trend,
            });
          }
          if (evaluated.customTargets) {
            for (const [colId, cVal] of Object.entries(evaluated.customTargets)) {
              if (colId !== ynCol?.id && colId !== valCol?.id && colId !== highestCol?.id) {
                recordsToUpsert.push({
                  projectId,
                  nodeId: node.id,
                  columnId: colId,
                  value: cVal,
                  scoreValue: cVal,
                });
              }
            }
          }
          if (notesCol && evaluated.notes) {
            recordsToUpsert.push({
              projectId,
              nodeId: node.id,
              columnId: notesCol.id,
              value: evaluated.notes,
            });
          }
        }
      }
    }

    // Upsert all calculated records into database
    for (const rec of recordsToUpsert) {
      await this.recordModel.upsert(rec);
    }

    // Now recalculate ScorecardRollup from real calculated rows strictly for assigned sections
    const categoryScores = assignedSections.map((section: any, idx: number) => {
      const secTitle = section.label || section.title || `Section ${idx + 1}`;
      const catKey = secTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const acc = categoryAccumulator[catKey] || { clientTotal: 0, highestTotal: 0 };

      const clientPoints = Number(acc.clientTotal.toFixed(1));
      const maxPoints = Number(acc.highestTotal.toFixed(1));
      const scorePct = maxPoints > 0 ? Number(((clientPoints / maxPoints) * 100).toFixed(1)) : 0;
      const score10 = Number((scorePct / 10).toFixed(1));

      return {
        categoryKey: catKey,
        categoryLabel: secTitle,
        totalClientPoints: clientPoints,
        totalMaxPoints: maxPoints,
        scorePercentage: scorePct,
        scoreTenScale: score10,
        rank: 0,
        metricsCount: (section.categories || []).reduce((sum: number, c: any) => sum + (c.groups?.length || 1), 0) || 6,
      };
    });

    // Rank categories
    const sorted = [...categoryScores].sort((a, b) => b.scoreTenScale - a.scoreTenScale);
    sorted.forEach((item, rIdx) => {
      const match = categoryScores.find((c) => c.categoryKey === item.categoryKey);
      if (match) match.rank = rIdx + 1;
    });

    const sumTenScale = categoryScores.reduce((sum, c) => sum + c.scoreTenScale, 0);
    const overallScoreTenScale = categoryScores.length > 0 ? Number((sumTenScale / categoryScores.length).toFixed(1)) : 0;
    const overallScorePercentage = Number((overallScoreTenScale * 10).toFixed(1));

    const band = overallScoreTenScale <= 2.0 ? 'Poor' : overallScoreTenScale <= 7.0 ? 'Average' : overallScoreTenScale <= 9.0 ? 'Good' : 'Excellent';

    await this.rollupModel.upsert({
      projectId,
      overallScoreTenScale,
      overallScorePercentage,
      performanceBand: band,
      categoryScores,
    });

    this.logger.log(`Project ${projectId} score calculation finished: ${calculatedRows} rows computed, overall score ${overallScoreTenScale}/10.`);

    return {
      calculatedRows,
      overallScore: overallScoreTenScale,
    };
  }
}
