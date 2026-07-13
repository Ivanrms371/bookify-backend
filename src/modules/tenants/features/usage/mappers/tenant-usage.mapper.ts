import { TenantUsage } from 'src/generated/prisma/client';
import { TenantUsageStatus } from '../interfaces/tenant-usage.interface';

export class TenantQuotaMapper {
  static toDomain(raw: TenantUsage): TenantUsageStatus {
    return {
      emails: {
        count: raw.emailCount,
        limit: raw.emailLimit,
        percentage: (raw.emailCount / raw.emailLimit) * 100,
      },
      whatsapp: {
        count: raw.whatsappCount,
        limit: raw.whatsappLimit,
        percentage: (raw.whatsappCount / raw.whatsappLimit) * 100,
      },
      appointments: {
        count: raw.appointmentCount,
        limit: raw.appointmentLimit,
        percentage: (raw.appointmentCount / raw.appointmentLimit) * 100,
      },
    };
  }
}
