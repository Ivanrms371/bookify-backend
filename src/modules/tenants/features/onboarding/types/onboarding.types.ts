import { Step } from '../config/onboarding-steps.config';
import { OnboardingStatus, TenantType, WorkspaceType } from 'src/generated/prisma/enums';
import { TenantOnboardingRaw } from './onboarding-raw.types';

export type OnboardingSavedData = {
  workspaceType: WorkspaceType | null;
  name: string | null;
  slug: string | null;
  type: TenantType | null;
  logoUrl: string | null;
  coverUrl: string | null;
  colorTheme: string | null;
  workingHours: TenantOnboardingRaw['tenantWorkingHours'];
  services: TenantOnboardingRaw['services'];
};

export type TenantOnboardingResponse = {
  onboardingStatus: OnboardingStatus;
  workspaceType: WorkspaceType;
  steps: Step[];
  savedData: OnboardingSavedData;
};
