import { TenantDailyStats, TenantLifetimeStats } from 'src/generated/prisma/client';
import { TenantLifetimeStat } from '../../domain/types/tenant-lifetime-stats.type';
import { Decimal } from '@prisma/client/runtime/client';

export class TenantLifetimeStatsMapper {
  static toDomain(raw: Partial<TenantLifetimeStats | null>): Partial<TenantLifetimeStat> {
    return {
      totalAppointments: raw?.totalAppointments ?? 0,
      totalRevenue: raw?.totalRevenue ?? new Decimal(0),
      totalCustomers: raw?.totalCustomers ?? 0,
      totalCancelled: raw?.totalCancelled ?? 0,
      totalCompleted: raw?.totalCompleted ?? 0,
      totalNoShow: raw?.totalNoShow ?? 0,
    };
  }
}
