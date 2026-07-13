import { OnboardingStatus, WorkspaceType } from 'src/generated/prisma/enums';
import { INDEPENDENT_STEP_ORDER, MULTI_STAFF_STEP_ORDER, StepId } from './onboarding-steps.config';

export function getOnboardingStepOrder(workspaceType: WorkspaceType): readonly StepId[] {
  switch (workspaceType) {
    case WorkspaceType.MULTI_STAFF:
      return MULTI_STAFF_STEP_ORDER;
    case WorkspaceType.INDEPENDENT:
      return INDEPENDENT_STEP_ORDER;
  }
}

export function getNextOnboardingStep(workspaceType: WorkspaceType | null, currentStep: StepId): OnboardingStatus {
  if (!workspaceType) {
    return OnboardingStatus.WORKSPACE_TYPE;
  }
  const order = getOnboardingStepOrder(workspaceType);
  const currentIndex = order.indexOf(currentStep);

  if (currentIndex === -1) {
    throw new Error(`Step "${currentStep}" no existe en el flujo de onboarding para "${workspaceType}"`);
  }

  const nextStep = order[currentIndex + 1];
  return nextStep ?? OnboardingStatus.COMPLETED;
}
