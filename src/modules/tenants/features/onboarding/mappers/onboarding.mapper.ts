import type { TenantOnboardingRaw } from '../types/onboarding-raw.types';
import type { TenantOnboardingResponse } from '../types/onboarding.types';
import { OnboardingStepMapper } from './onboarding-step.mapper';
import { OnboardingSavedDataMapper } from './onboarding-saved-data.mapper';
import { WorkspaceType } from 'src/generated/prisma/enums';

export class OnboardingMapper {
  static toResponse(raw: TenantOnboardingRaw): Omit<TenantOnboardingResponse, 'trial'> {
    return {
      tenantId: raw.id,
      onboardingStatus: raw.onboardingStatus,
      workspaceType: raw.workspaceType ?? WorkspaceType.INDIVIDUAL,
      steps: OnboardingStepMapper.forStatus(raw.onboardingStatus),
      savedData: OnboardingSavedDataMapper.toResponse(raw),
    };
  }
}
