import type { ProfessionalDraft } from './professional-draft.types';
import { Step } from '../config/onboarding-steps.config';
import { OnboardingStatus, TenantType, WorkspaceType } from 'src/generated/prisma/enums';
import { TenantOnboardingRaw } from './onboarding-raw.types';

import type { WorkingHoursResponse } from '../mappers/working-hour.mapper';

export type OnboardingSavedData = {
  workspaceType: WorkspaceType | null;
  name: string | null;
  slug: string | null;
  type: TenantType | null;
  logoUrl: string | null;
  coverUrl: string | null;
  colorTheme: string | null;
  logoPublicId: string | null;
  coverPublicId: string | null;
  professional: ProfessionalDraft | null;
  workingHours: WorkingHoursResponse;
  services: TenantOnboardingRaw['services'];
};

export type TenantOnboardingResponse = {
  tenantId: string;
  trial: { planName: string; durationDays: number };
  onboardingStatus: OnboardingStatus;
  workspaceType: WorkspaceType;
  steps: Step[];
  savedData: OnboardingSavedData;
};
