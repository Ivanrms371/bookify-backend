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
      case WorkspaceType.MULTI_STAFF:
        return {
          ...base,
          workspaceType: WorkspaceType.MULTI_STAFF,
          steps: OnboardingStepMapper.forWorkspaceType(raw.workspaceType, raw.onboardingStatus as StepId),
        };
      case WorkspaceType.INDEPENDENT:
        return {
          ...base,
          workspaceType: WorkspaceType.INDEPENDENT,
          steps: OnboardingStepMapper.forWorkspaceType(raw.workspaceType, raw.onboardingStatus as StepId),
        };
      default:
        return {
          ...base,
          workspaceType: WorkspaceType.MULTI_STAFF,
          steps: OnboardingStepMapper.forWorkspaceType(WorkspaceType.MULTI_STAFF, raw.onboardingStatus as StepId),
        };
    }
  }
}
