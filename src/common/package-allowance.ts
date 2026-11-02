/** Option A: separate project slots unlocked per paid package. */
export const PACKAGE_PROJECT_ALLOWANCE: Record<string, number> = {
  scorecard_only: 1,
  subscription: 3,
  combined: 4,
};

export function projectSlotsForPackage(packageType: string | null | undefined): number {
  if (!packageType) return 0;
  return PACKAGE_PROJECT_ALLOWANCE[packageType] ?? 0;
}
