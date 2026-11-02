/**
 * Hybrid Master Sources + Kathleen free-API list:
 *
 * 1) Metrics covered by free APIs (Census / BLS / EPA / CDC / DOT) → auto-fill
 *    from that API only (City/County geo as configured). Master "ESRI" label does
 *    NOT block fill for these rows (option A).
 * 2) Metrics that are licensed ESRI / CoStar / Moody’s (and not in free list) →
 *    leave empty for admin retrieve & enter.
 * 3) Inventory → questionnaire only.
 * 4) Tax GIS (no live integration yet) → admin empty.
 */

export type MetricFillMode =
  | 'ADMIN_EMPTY'
  | 'AUTO_CENSUS'
  | 'AUTO_BLS'
  | 'AUTO_EPA'
  | 'AUTO_CDC'
  | 'AUTO_NCDOT'
  | 'QUESTIONNAIRE'
  | 'UNMAPPED';

export type LicensedProvider = 'ESRI' | 'COSTAR' | 'MOODYS_CRE';

export const LICENSED_PROVIDERS: LicensedProvider[] = ['ESRI', 'COSTAR', 'MOODYS_CRE'];

export const LICENSED_SOURCE_LABELS: Record<LicensedProvider, string> = {
  ESRI: 'ESRI/ArcGIS',
  COSTAR: 'CoStar',
  MOODYS_CRE: "Moody's CRE",
};

/**
 * Kathleen free-API coverage (auto-fill). Patterns match scorecard node labels.
 * Order matters: first match wins — put free-API rules BEFORE admin-empty ESRI leftovers.
 */
const RULES: Array<{ mode: MetricFillMode; patterns: string[]; provider?: LicensedProvider }> = [
  // --- Census ACS (city place or county) ---
  {
    mode: 'AUTO_CENSUS',
    patterns: [
      'median home value',
      'median rent',
      'renter occupied',
      'hs graduation',
      'bachelor',
      'associates',
      'some college',
      'graduate/phd',
      'graduate',
      'poverty',
      'households below poverty',
      'median hh income',
      'average hh income',
      'mean household',
      'per capita',
      'commute time',
      'cost burdened',
      'retail trade',
      'accommodations & food',
      'arts, entertainment',
      'healthcare sector',
      'w/o vehicle',
      'without vehicle',
      'labor participation', // ACS DP03; BLS LAUS is unemployment-focused
      'structure year built',
      'year built',
      'agricultural employment',
      '% services employed',
      'services employed',
      'white collar',
      'blue collar',
    ],
  },

  // --- BLS LAUS (county only; city skipped in ingestion) ---
  {
    mode: 'AUTO_BLS',
    patterns: ['unemployment'],
  },

  // --- EPA AQS (county only; city skipped) ---
  {
    mode: 'AUTO_EPA',
    patterns: ['air quality'],
  },

  // --- CDC PLACES ---
  {
    mode: 'AUTO_CDC',
    patterns: [
      'uninsured',
      'fair or poor',
      'health status',
      'food insecurity',
      'routine checkup',
      'county health factors',
    ],
  },

  // --- State DOT / NCDOT ---
  {
    mode: 'AUTO_NCDOT',
    patterns: [
      'interstate',
      'us highway',
      'state highway',
      'stip',
      'state transportation funds',
      'roadways (stip)',
    ],
  },

  // --- Licensed / staff only (NOT in free API list) → empty for admin ---
  {
    mode: 'ADMIN_EMPTY',
    provider: 'ESRI',
    patterns: [
      'personal crime',
      'property crime',
      'diversity index',
      'healthy food',
      'access to healthy food',
    ],
  },
  {
    mode: 'ADMIN_EMPTY',
    provider: 'COSTAR',
    patterns: ['retail vacancy'],
  },
  {
    mode: 'ADMIN_EMPTY',
    provider: 'MOODYS_CRE',
    patterns: ['moody'],
  },
  // Tax portals — free in theory, no live integration yet
  {
    mode: 'ADMIN_EMPTY',
    patterns: [
      'residential property tax',
      'commercial property tax',
      'low performing',
      'k-12 performance',
      'chronic absent',
    ],
  },

  // Inventory → questionnaire
  {
    mode: 'QUESTIONNAIRE',
    patterns: [
      'airport',
      'train',
      'rapid bus',
      'city bus',
      'trolley',
      'rideshare',
      'micro transit',
      'bike and ped',
      'pedestrian plan',
      'public art',
      'murals',
      'community center',
      'museum',
      'theatre',
      'theater',
      'event venues',
      'festivals',
      'officer to resident',
      'national standard',
      'community college',
      'trade school',
      'universities',
      'pad ready',
      'buildings > 5000',
      '500+ employee',
      '1000+ employee',
      'fortune',
      'hospitals',
      'beds per 1,000',
      'clinics',
      'medical facilities',
      'historic districts',
      'main st. designation',
      'main st. manager',
      'downtown manager',
      'registered buildings',
      'historic tour map',
      'business improvement',
      'municipal service',
      'recreation plan',
      'parks and rec director',
      'greenway',
      'natural/recreational',
      'open space/parks',
      'conservation ordinances',
      'state park',
      'voluntary agricultural',
      'vad',
      'tax exempt',
      'vacant land',
      'comprehensive land use',
      'green energy',
      'stormwater',
      'water quality',
      'emergency planning',
      'sewer capacity',
      'water capacity',
      'electric capacity',
      'broadband',
      'expansion plans',
    ],
  },
];

export function resolveMetricFillPolicy(nodeLabel: string): {
  mode: MetricFillMode;
  provider?: LicensedProvider;
} {
  const label = String(nodeLabel || '').toLowerCase();
  for (const rule of RULES) {
    if (rule.patterns.some((p) => label.includes(p))) {
      return { mode: rule.mode, provider: rule.provider };
    }
  }
  return { mode: 'UNMAPPED' };
}

export function isAdminEmptyMetric(nodeLabel: string): boolean {
  return resolveMetricFillPolicy(nodeLabel).mode === 'ADMIN_EMPTY';
}

/** Whether an auto-proposed source string is allowed for this node. */
export function allowsProposedSource(
  nodeLabel: string,
  sourceLabel: string,
  fromQuestionnaire: boolean,
): boolean {
  const { mode } = resolveMetricFillPolicy(nodeLabel);
  const src = String(sourceLabel || '').toLowerCase();

  if (mode === 'ADMIN_EMPTY') return false;

  if (mode === 'QUESTIONNAIRE') {
    return fromQuestionnaire || src.includes('questionnaire') || src.includes('phase 2');
  }

  if (mode === 'AUTO_CENSUS') {
    return (
      src.includes('census') ||
      src.includes('acs') ||
      src.includes('quickfacts') ||
      src === 'us_census'
    );
  }

  if (mode === 'AUTO_BLS') {
    return src.includes('bls') || src === 'bls';
  }

  if (mode === 'AUTO_EPA') {
    return src.includes('epa') || src === 'epa';
  }

  if (mode === 'AUTO_CDC') {
    return src.includes('cdc') || src.includes('places');
  }

  if (mode === 'AUTO_NCDOT') {
    return src.includes('ncdot') || src.includes('stip') || src.includes('highway');
  }

  return false;
}

export function licensedProviderFromSource(source: string): LicensedProvider | null {
  const s = String(source || '').toUpperCase();
  if (s.includes('MOODY')) return 'MOODYS_CRE';
  if (s.includes('COSTAR') || s.includes('CO STAR')) return 'COSTAR';
  if (s.includes('ESRI') || s.includes('ARCGIS')) return 'ESRI';
  return null;
}
