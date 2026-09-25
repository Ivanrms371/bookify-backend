import { OnboardingStatus, WorkspaceType } from 'src/generated/prisma/enums';
import { INDIVIDUAL_STEP_ORDER, TEAM_STEP_ORDER, StepId } from './onboarding-steps.config';
import { ConflictException } from '@nestjs/common';

export function getOnboardingStepOrder(workspaceType: WorkspaceType): readonly StepId[] {
  switch (workspaceType) {
    case WorkspaceType.TEAM:
      return TEAM_STEP_ORDER;
    case WorkspaceType.INDIVIDUAL:
      return INDIVIDUAL_STEP_ORDER;
  }
}

export function getNextOnboardingStep(workspaceType: WorkspaceType | null, currentStep: StepId): OnboardingStatus {
  if (currentStep === OnboardingStatus.COMPLETED) {
    throw new ConflictException('Onbarding already is completed');
  }

  if (!workspaceType) {
    return OnboardingStatus.WORKSPACE_TYPE;
  }
  const order = getOnboardingStepOrder(workspaceType);
  const currentIndex = order.indexOf(currentStep);

  if (currentIndex === -1) {
    throw new ConflictException(`Step "${currentStep}" does not exists in onboarding for "${workspaceType}"`);
  }

  const nextStep = order[currentIndex + 1];
  return nextStep ?? OnboardingStatus.COMPLETED;
}
