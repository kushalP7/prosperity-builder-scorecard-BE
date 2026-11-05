/** Canonical 12 scorecard categories (ScorecardCategoriesSection) — used in inquiry emails. */
export const SCORECARD_CATEGORY_NAMES = [
  'Accessibility & Transportation',
  'Arts & Culture',
  'Crime & Public Safety',
  'Education',
  'Employment & Labor',
  'Goods & Services',
  'Healthcare & Wellness',
  'Historic Preservation',
  'Population & Housing',
  'Infrastructure',
  'Open Space & Recreation',
  'Planning & Land Use',
] as const;

/** Pre-uploaded private brochure on S3; inquiries only mint a 7-day signed URL. */
export const BROCHURE_S3_KEY_DEFAULT = 'Rose/private/Prosperity-Builder-Subscription-Scorecard-Brochure.pdf';
export const BROCHURE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
