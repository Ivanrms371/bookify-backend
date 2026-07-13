import { TenantDailyStats } from 'src/generated/prisma/client';
import { TenantDailyStat } from '../../domain/types/tenant-daily-stats.type';

export class TenantDailyStatsMapper {
  static toDomain(raw: Partial<TenantDailyStats>): Partial<TenantDailyStat> {
    return {
      date: raw.date,
      revenue: raw.revenue,
      appointments: raw.appointments,
      confirmed: raw.confirmed,
      cancelled: raw.cancelled,
      completed: raw.completed,
      noShow: raw.noShow,
      newCustomers: raw.newCustomers,
    };
  }

  static toDomainList(raw: Partial<TenantDailyStats>[]): Partial<TenantDailyStat>[] {
    return raw.map((r) => this.toDomain(r));
  }
}
