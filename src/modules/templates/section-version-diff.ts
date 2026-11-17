export type SectionDiffChange = {
  path: string;
  field?: string;
  before?: unknown;
  after?: unknown;
};

export type SectionDiffSummary = {
  fromVersion?: number;
  toVersion?: number;
  added: string[];
  removed: string[];
  changed: SectionDiffChange[];
};

type AnyRec = Record<string, any>;

function normLabel(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function stableKey(item: AnyRec | null | undefined, labelFields: string[]): string {
  if (!item) return '';
  for (const field of labelFields) {
    const v = item[field];
    if (v != null && String(v).trim()) return normLabel(v);
  }
  return item.id ? `id:${item.id}` : '';
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function flattenGroups(categories: AnyRec[] = []): Array<AnyRec & { __categoryLabel?: string }> {
  const rows: Array<AnyRec & { __categoryLabel?: string }> = [];
  for (const cat of categories) {
    for (const grp of cat.groups || []) {
      rows.push({ ...grp, __categoryLabel: cat.label });
    }
  }
  return rows;
}

/**
 * Compare two section trees (live includes or snapshot shape).
 * Matching uses label/name first so versions with new UUIDs still diff meaningfully.
 */
export function diffSectionTrees(
  fromTree: AnyRec | null | undefined,
  toTree: AnyRec | null | undefined,
  meta?: { fromVersion?: number; toVersion?: number },
): SectionDiffSummary {
  const from = fromTree || {};
  const to = toTree || {};
  const added: string[] = [];
  const removed: string[] = [];
  const changed: SectionDiffChange[] = [];

  for (const field of ['label', 'description'] as const) {
    if (!valuesEqual(from[field], to[field])) {
      changed.push({
        path: 'section',
        field,
        before: from[field] ?? null,
        after: to[field] ?? null,
      });
    }
  }

  const fromCats = (from.categories || []) as AnyRec[];
  const toCats = (to.categories || []) as AnyRec[];
  const fromCatMap = new Map(fromCats.map((c) => [stableKey(c, ['label']), c]));
  const toCatMap = new Map(toCats.map((c) => [stableKey(c, ['label']), c]));

  for (const [key, cat] of toCatMap) {
    if (!key) continue;
    if (!fromCatMap.has(key)) {
      added.push(`Category: ${cat.label || key}`);
    } else {
      const prev = fromCatMap.get(key)!;
      for (const field of ['label', 'description', 'scoringNotes']) {
        if (!valuesEqual(prev[field], cat[field])) {
          changed.push({
            path: `category:${cat.label || key}`,
            field,
            before: prev[field] ?? null,
            after: cat[field] ?? null,
          });
        }
      }
    }
  }
  for (const [key, cat] of fromCatMap) {
    if (!key) continue;
    if (!toCatMap.has(key)) {
      removed.push(`Category: ${cat.label || key}`);
    }
  }

  const fromGroups = flattenGroups(fromCats);
  const toGroups = flattenGroups(toCats);
  const groupKey = (g: AnyRec) =>
    `${normLabel(g.__categoryLabel)}::${stableKey(g, ['label'])}`;
  const fromGroupMap = new Map(fromGroups.map((g) => [groupKey(g), g]));
  const toGroupMap = new Map(toGroups.map((g) => [groupKey(g), g]));

  const groupFields = [
    'label',
    'weight',
    'highestScore',
    'scoringType',
    'formula',
    'scoringNotes',
    'scoringRules',
    'columnDefaults',
  ];

  for (const [key, grp] of toGroupMap) {
    if (!key || key.endsWith('::')) continue;
    const label = `${grp.__categoryLabel || '?'} / ${grp.label || key}`;
    if (!fromGroupMap.has(key)) {
      added.push(`Group: ${label}`);
    } else {
      const prev = fromGroupMap.get(key)!;
      for (const field of groupFields) {
        if (!valuesEqual(prev[field], grp[field])) {
          changed.push({
            path: `group:${label}`,
            field,
            before: prev[field] ?? null,
            after: grp[field] ?? null,
          });
        }
      }
    }
  }
  for (const [key, grp] of fromGroupMap) {
    if (!key || key.endsWith('::')) continue;
    if (!toGroupMap.has(key)) {
      removed.push(`Group: ${grp.__categoryLabel || '?'} / ${grp.label || key}`);
    }
  }

  const fromCols = (from.columns || []) as AnyRec[];
  const toCols = (to.columns || []) as AnyRec[];
  const fromColMap = new Map(fromCols.map((c) => [stableKey(c, ['name', 'label']), c]));
  const toColMap = new Map(toCols.map((c) => [stableKey(c, ['name', 'label']), c]));
  const colFields = [
    'name',
    'type',
    'weight',
    'formulaExpression',
    'isReadOnly',
    'validationMin',
    'validationMax',
    'scoringRule',
  ];

  for (const [key, col] of toColMap) {
    if (!key) continue;
    const name = col.name || col.label || key;
    if (!fromColMap.has(key)) {
      added.push(`Column: ${name}`);
    } else {
      const prev = fromColMap.get(key)!;
      for (const field of colFields) {
        if (!valuesEqual(prev[field], col[field])) {
          changed.push({
            path: `column:${name}`,
            field,
            before: prev[field] ?? null,
            after: col[field] ?? null,
          });
        }
      }
    }
  }
  for (const [key, col] of fromColMap) {
    if (!key) continue;
    if (!toColMap.has(key)) {
      removed.push(`Column: ${col.name || col.label || key}`);
    }
  }

  return {
    fromVersion: meta?.fromVersion,
    toVersion: meta?.toVersion,
    added,
    removed,
    changed,
  };
}

export function sectionTreeFromRecord(section: AnyRec | null | undefined): AnyRec {
  if (!section) return {};
  if (section.snapshot?.categories || section.snapshot?.columns) {
    return {
      label: section.label,
      description: section.description,
      categories: section.snapshot.categories || section.categories || [],
      columns: section.snapshot.columns || section.columns || [],
    };
  }
  return {
    label: section.label,
    description: section.description,
    categories: section.categories || [],
    columns: section.columns || [],
  };
}
