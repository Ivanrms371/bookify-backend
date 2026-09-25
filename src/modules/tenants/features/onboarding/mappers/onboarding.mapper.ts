import type { TenantOnboardingRaw } from '../types/onboarding-raw.types';
import type { TenantOnboardingResponse } from '../types/onboarding.types';
import { OnboardingStepMapper } from './onboarding-step.mapper';
import { OnboardingSavedDataMapper } from './onboarding-saved-data.mapper';
import { WorkspaceType } from 'src/generated/prisma/enums';
import { StepId } from '../config/onboarding-steps.config';

export class OnboardingMapper {
  static toResponse(raw: TenantOnboardingRaw): TenantOnboardingResponse {
    const base = {
      onboardingStatus: raw.onboardingStatus,
      savedData: OnboardingSavedDataMapper.toResponse(raw),
    };

    switch (raw.workspaceType) {
      case WorkspaceType.TEAM:
        return {
          ...base,
          workspaceType: WorkspaceType.TEAM,
          steps: OnboardingStepMapper.forWorkspaceType(raw.workspaceType, raw.onboardingStatus),
        };
      case WorkspaceType.INDIVIDUAL:
        return {
          ...base,
          workspaceType: WorkspaceType.INDIVIDUAL,
          steps: OnboardingStepMapper.forWorkspaceType(raw.workspaceType, raw.onboardingStatus),
        };
      default:
        return {
          ...base,
          workspaceType: WorkspaceType.INDIVIDUAL,
          steps: OnboardingStepMapper.forWorkspaceType(WorkspaceType.INDIVIDUAL, raw.onboardingStatus),
        };
    }
  }
}
