import { Injectable } from '@nestjs/common';
import { TenantDailyStatsSelect } from 'src/generated/prisma/models/TenantDailyStats';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class TenantStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyStatsByRange(tenantId: string, startDate: Date, endDate: Date, fields: TenantDailyStatsSelect) {
    return this.prisma.tenantDailyStats.findMany({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: fields,
    });
  }

  async aggregateStatsByRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.prisma.tenantDailyStats.aggregate({
      where: {
        tenantId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        revenue: true,
        newCustomers: true,
        appointments: true,
      },
    });
  }

  async getDailyStatsByDate(tenantId: string, date: Date, fields?: TenantDailyStatsSelect) {
    return this.prisma.tenantDailyStats.findUnique({
      where: {
        tenantId_date: {
          tenantId,
          date,
        },
      },
      select: fields,
    });
  }
}
