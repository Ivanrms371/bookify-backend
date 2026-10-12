import { TenantUsage } from 'src/generated/prisma/client';
import type { MonthlyUsageStatus } from '../types/tenant-usage.types';

export class TenantQuotaMapper {
  static toDomain(raw: TenantUsage): MonthlyUsageStatus {
    return {
      emails: {
        count: raw.emailCount,
        limit: raw.emailLimit,
        percentage: raw.emailLimit === 0 ? 0 : (raw.emailCount / raw.emailLimit) * 100,
      },
      whatsapp: {
        count: raw.whatsappCount,
        limit: raw.whatsappLimit,
        percentage: raw.whatsappLimit === 0 ? 0 : (raw.whatsappCount / raw.whatsappLimit) * 100,
      },
      appointments: {
        count: raw.appointmentCount,
        limit: raw.appointmentLimit,
        percentage: raw.appointmentLimit === 0 ? 0 : (raw.appointmentCount / raw.appointmentLimit) * 100,
      },
    };
  }
}
