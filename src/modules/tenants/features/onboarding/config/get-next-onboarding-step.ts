import { ConflictException } from '@nestjs/common';
import { OnboardingStatus } from 'src/generated/prisma/enums';
import { ONBOARDING_STEP_ORDER, type StepId } from './onboarding-steps.config';

export function getNextOnboardingStep(currentStep: StepId): OnboardingStatus {
  const index = ONBOARDING_STEP_ORDER.indexOf(currentStep);
  if (index < 0 || currentStep === 'COMPLETED') throw new ConflictException('Onboarding step cannot advance');
  return ONBOARDING_STEP_ORDER[index + 1];
}
