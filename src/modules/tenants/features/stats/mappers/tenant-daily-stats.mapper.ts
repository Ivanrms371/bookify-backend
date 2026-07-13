import { 
  eachDayOfInterval, 
  isSameDay, 
  startOfDay 
} from 'date-fns';
import { TenantDailyStats } from 'src/generated/prisma/client';
import { TenantDailyStat } from '../types/tenant-daily-stats.type';

export class TenantDailyStatsMapper {
  static toDomain(raw: Partial<TenantDailyStats>): Partial<TenantDailyStat> {
    return {
      date: raw.date,
      // Usamos Number() porque Prisma devuelve los Decimal como string en el JSON
      revenue: Number(raw.revenue || 0),
      appointments: raw.appointments || 0,
      confirmed: raw.confirmed || 0,
      cancelled: raw.cancelled || 0,
      completed: raw.completed || 0,
      noShow: raw.noShow || 0,
      newCustomers: raw.newCustomers || 0,
    };
  }

  static toDomainList(
    raw: Partial<TenantDailyStats>[], 
    startDate: Date, 
    endDate: Date
  ): Partial<TenantDailyStat>[] {
    const allDaysInInterval = eachDayOfInterval({
      start: startOfDay(startDate),
      end: startOfDay(endDate),
    });

    return allDaysInInterval.map((currentDay) => {
      const statsForDay = raw.filter((r) => 
        r.date && isSameDay(new Date(r.date), currentDay)
      );

      if (statsForDay.length === 0) {
        return {
          date: currentDay,
          revenue: 0,
          appointments: 0,
          confirmed: 0,
          cancelled: 0,
          completed: 0,
          noShow: 0,
          newCustomers: 0,
        };
      }

      return statsForDay.reduce((acc, curr) => {
        const mapped = this.toDomain(curr);
        return {
          date: currentDay, 
          revenue: (acc.revenue || 0) + (mapped.revenue || 0),
          appointments: (acc.appointments || 0) + (mapped.appointments || 0),
          confirmed: (acc.confirmed || 0) + (mapped.confirmed || 0),
          cancelled: (acc.cancelled || 0) + (mapped.cancelled || 0),
          completed: (acc.completed || 0) + (mapped.completed || 0),
          noShow: (acc.noShow || 0) + (mapped.noShow || 0),
          newCustomers: (acc.newCustomers || 0) + (mapped.newCustomers || 0),
        };
      }, {} as Partial<TenantDailyStat>);
    });
  }
}