import { TenantOnboardingRaw } from '../types/onboarding-raw.types';

type WorkingHourRaw = TenantOnboardingRaw['tenantWorkingHours'][number];

export class WorkingHourMapper {
  static toResponse(raw: WorkingHourRaw) {
    return {
      dayOfWeek: raw.dayOfWeek,
      opensAt: raw.opensAt,
      closesAt: raw.closesAt,
    };
  }
}
