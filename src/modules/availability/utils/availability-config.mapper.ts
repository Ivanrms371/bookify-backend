import { Injectable } from '@nestjs/common';
import { AvailabilityConfig, AvailabilityConfigQuery } from '../types/availability-config.type';

@Injectable()
export class AvailabilityConfigMapper {
  toAvailabilityConfig(query: AvailabilityConfigQuery): AvailabilityConfig {
    return {
      workingHours: query.workingHours?.length > 0 ? query.workingHours : query.tenant?.tenantWorkingHours || [],
      slotIntervalMinutes: query.slotIntervalMinutes ?? query.tenant?.settings?.slotIntervalMinutes ?? 30,
      minAdvancedMinutes: query.minAdvancedMinutes ?? query.tenant?.settings?.minAdvancedMinutes ?? 0,
      maxAdvancedDays: query.tenant?.settings?.maxAdvancedDays ?? 30,
      timeZone: query.tenant?.settings?.timeZone ?? 'America/Montevideo',
    };
  }
}
