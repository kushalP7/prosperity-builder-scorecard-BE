import { ProjectStatus } from '../modules/projects/entities/project.entity';

/**
 * Customer roadmap (Orders UI) — 5 steps:
 * 1 Package & Pay → 2 Intake → 3 API Ingestion → 4 Review & Report → 5 Released
 */
export function timelineStepFromProjectStatus(
  projectStatus: string | null | undefined,
  orderIsPaid: boolean,
): number {
  if (!orderIsPaid) return 1;
  if (!projectStatus) return 2;

  switch (String(projectStatus)) {
    case ProjectStatus.PUBLISHED:
    case 'PUBLISHED':
      return 5;
    case ProjectStatus.IN_REVIEW:
    case ProjectStatus.CALCULATED:
    case 'IN_REVIEW':
    case 'CALCULATED':
      return 4;
    case ProjectStatus.INTAKE_SUBMITTED:
    case 'INTAKE_SUBMITTED':
    case 'INGESTION_RUNNING': // legacy DB values map to ingestion step
      return 3;
    case ProjectStatus.INTAKE_PENDING:
    case 'INTAKE_PENDING':
    case 'ONBOARDING': // legacy DB values map to intake step
    default:
      return 2;
  }
}
