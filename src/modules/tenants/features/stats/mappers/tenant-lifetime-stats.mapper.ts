import { TenantLifetimeStats } from 'src/generated/prisma/client';
import { TenantLifetimeStat } from 'src/modules/portal/domain/types/tenant-lifetime-stats.type';

export class TenantLifetimeStatsMapper {
  static toDomain(raw: Partial<TenantLifetimeStats>): Partial<TenantLifetimeStat> {
    return {
      totalAppointments: raw.totalAppointments,
      totalRevenue: raw.totalRevenue,
      totalCancelled: raw.totalCancelled,
      totalCompleted: raw.totalCompleted,
      totalNoShow: raw.totalNoShow,
      totalCustomers: raw.totalCustomers,
    };
  }
}
