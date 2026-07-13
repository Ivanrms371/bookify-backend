import { NotFoundException } from '@nestjs/common';
import { TenantInput } from '../types/onboarding-status.type';
import { ONBOARDING_STEPS_BASIC_PLAN, ONBOARDING_STEPS_TEAM_PLAN } from 'src/common/constants/onboarding.constants';

const getCurrentStepForTeamPlan = (tenant: TenantInput) => {
  const hasAddress = Boolean(tenant.addressLine1);
  const hasTenantWorkingHours = (tenant.tenantWorkingHours ?? []).length > 0;
  const hasMemberships = (tenant.members ?? []).length > 1;

  if (tenant.onboardingCompleted) {
    return ONBOARDING_STEPS_TEAM_PLAN.length + 1;
  }

  if (!hasAddress) {
    return 1;
  }

  if (!hasTenantWorkingHours) {
    return 2;
  }

  if (!hasMemberships) {
    return 3;
  }

  return 4;
};

const getCurrentStepForBasicPlan = (tenant: TenantInput) => {
  const hasAddress = Boolean(tenant.addressLine1);
  const hasTenantWorkingHours = (tenant.tenantWorkingHours ?? []).length > 0;

  if (tenant.onboardingCompleted) {
    return ONBOARDING_STEPS_BASIC_PLAN.length + 1;
  }

  if (!hasAddress) {
    return 1;
  }

  if (!hasTenantWorkingHours) {
    return 2;
  }

  return 3;
};

export function calculateOnboardingSteps(tenant: TenantInput): { currentStep: number; steps: { id: string; label: string }[] } {
  const plan = tenant.subscription?.plan?.name;

  switch (plan) {
    case 'Plan Free':
    case 'Plan Pro':
      return {
        currentStep: getCurrentStepForBasicPlan(tenant),
        steps: ONBOARDING_STEPS_BASIC_PLAN,
      };
    case 'Plan Team':
      return {
        currentStep: getCurrentStepForTeamPlan(tenant),
        steps: ONBOARDING_STEPS_TEAM_PLAN,
      };
    default:
      throw new NotFoundException(`Plan desconocido: ${plan}`);
  }
}
