import type { TenantOnboardingRaw } from '../types/onboarding-raw.types';

type ServiceRaw = TenantOnboardingRaw['services'][number];

export class ServiceMapper {
  static toResponse(raw: ServiceRaw) {
    return {
      id: raw.id,
      name: raw.name,
      price: raw.price,
      durationMinutes: raw.durationMinutes,
    };
  }
}
