export const ONBOARDING_STEP_ORDER = [
  'BUSINESS_DETAILS',
  'SERVICES',
  'SCHEDULE',
  'PROFESSIONAL_PROFILE',
  'CUSTOMIZE',
  'CONFIRM',
  'COMPLETED',
] as const;
export type StepId = (typeof ONBOARDING_STEP_ORDER)[number];
export enum StepStatus {
  PENDING = 'PENDING',
  CURRENT = 'CURRENT',
  COMPLETED = 'COMPLETED',
}
export type Step = { id: string; label: string; status: StepStatus };
export const STEP_LABELS: Record<StepId, string> = {
  BUSINESS_DETAILS: 'Tu negocio',
  SERVICES: 'Tus servicios',
  SCHEDULE: 'Tus horarios',
  PROFESSIONAL_PROFILE: 'Tu perfil profesional',
  CUSTOMIZE: 'Personaliza tu página',
  CONFIRM: 'Confirmar',
  COMPLETED: 'Finalizado',
};
