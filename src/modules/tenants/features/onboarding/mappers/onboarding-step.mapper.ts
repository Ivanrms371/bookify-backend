import { Step, STEP_LABELS, StepId, StepStatus } from '../config/onboarding-steps.config';
import { WorkspaceType } from 'src/generated/prisma/enums';
import { getOnboardingStepOrder } from '../config/get-next-onboarding-step';

export class OnboardingStepMapper {
  static forWorkspaceType(workspaceType: WorkspaceType, currentStep: StepId): Step[] {
    const order = getOnboardingStepOrder(workspaceType);
    const currentIndex = order.indexOf(currentStep);

    if (currentIndex === -1) {
      throw new Error(`Step "${currentStep}" no existe en el order de "${workspaceType}"`);
    }

    return order.map((id, index) => ({
      id,
      label: STEP_LABELS[id].label,
      status: OnboardingStepMapper.resolveStatus(index, currentIndex),
    }));
  }

  private static resolveStatus(index: number, currentIndex: number): StepStatus {
    if (index < currentIndex) return StepStatus.COMPLETED;
    if (index === currentIndex) return StepStatus.CURRENT;
    return StepStatus.PENDING;
  }
}
