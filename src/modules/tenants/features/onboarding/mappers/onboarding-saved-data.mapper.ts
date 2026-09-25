import type { TenantOnboardingRaw } from '../types/onboarding-raw.types';
import type { OnboardingSavedData } from '../types/onboarding.types';
import { ServiceMapper } from './service.mapper';
import { WorkingHoursMapper } from './working-hour.mapper';

export class OnboardingSavedDataMapper {
  static toResponse(raw: TenantOnboardingRaw): OnboardingSavedData {
    return {
      workspaceType: raw.workspaceType,
      name: raw.name,
      slug: raw.slug,
      type: raw.type,
      logoUrl: raw.logoUrl,
      coverUrl: raw.coverUrl,
      colorTheme: raw.colorTheme,
      workingHours: WorkingHoursMapper.toResponse(raw.tenantWorkingHours),
      services: raw.services.map(ServiceMapper.toResponse),
    };
  }
}
