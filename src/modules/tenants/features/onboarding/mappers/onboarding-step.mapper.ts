import { ONBOARDING_STEP_ORDER, STEP_LABELS, StepStatus, type Step } from '../config/onboarding-steps.config';

export class OnboardingStepMapper {
  static forStatus(currentStep: string): Step[] {
    const currentIndex = ONBOARDING_STEP_ORDER.findIndex((id) => id === currentStep);
    return ONBOARDING_STEP_ORDER.filter((id) => id !== 'COMPLETED').map((id, index) => ({
      id,
      label: STEP_LABELS[id],
      status: index < currentIndex ? StepStatus.COMPLETED : index === currentIndex ? StepStatus.CURRENT : StepStatus.PENDING,
    }));
  }
}
