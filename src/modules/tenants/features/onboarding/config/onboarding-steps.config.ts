// config/onboarding-steps.config.ts

export const INDIVIDUAL_STEP_ORDER = [
  'WORKSPACE_TYPE',
  'BUSINESS_DETAILS',
  'SCHEDULE',
  'SERVICES',
  'CUSTOMIZE',
  'CONFIRM',
  'COMPLETED',
] as const;

export const TEAM_STEP_ORDER = [
  'WORKSPACE_TYPE',
  'BUSINESS_DETAILS',
  'SCHEDULE',
  'SERVICES',
  'TEAM_INVITE',
  'CUSTOMIZE',
  'CONFIRM',
  'COMPLETED',
] as const;

export type StepId = (typeof INDIVIDUAL_STEP_ORDER)[number] | (typeof TEAM_STEP_ORDER)[number];
export enum StepStatus {
  PENDING = 'PENDING',
  CURRENT = 'CURRENT',
  COMPLETED = 'COMPLETED',
}
export type Step = {
  id: string;
  label: string;
  status: StepStatus;
};

export const STEP_LABELS: Record<StepId, Step> = {
  WORKSPACE_TYPE: {
    label: 'Uso',
    id: 'WORKSPACE_TYPE',
    status: StepStatus.PENDING,
  },
  BUSINESS_DETAILS: {
    label: 'Negocio',
    id: 'BUSINESS_DETAILS',
    status: StepStatus.PENDING,
  },
  SCHEDULE: {
    label: 'Horarios',
    id: 'SCHEDULE',
    status: StepStatus.PENDING,
  },
  SERVICES: {
    label: 'Servicios',
    id: 'SERVICES',
    status: StepStatus.PENDING,
  },
  TEAM_INVITE: {
    label: 'Equipo',
    id: 'TEAM_INVITE',
    status: StepStatus.PENDING,
  },
  CUSTOMIZE: {
    label: 'Customizar',
    id: 'CUSTOMIZE',
    status: StepStatus.PENDING,
  },
  CONFIRM: {
    label: 'Confirmar',
    id: 'CONFIRM',
    status: StepStatus.PENDING,
  },
  COMPLETED: {
    label: 'Finalizado',
    id: 'COMPLETED',
    status: StepStatus.COMPLETED,
  },
};
