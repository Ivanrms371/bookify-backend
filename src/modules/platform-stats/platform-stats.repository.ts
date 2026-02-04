import { Injectable } from '@nestjs/common';
import { getToday, getYesterday } from 'src/common/utils/dates.util';
import { Prisma } from 'src/generated/prisma/client';
import { PlatformStatsUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PlatformStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStatsByDate(date: Date, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    return db.platformStats.findUnique({
      where: { date },
    });
  }

  async createDailyStatsFromYesterday(tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    const yesterday = getYesterday();
    const yesterdayStats = await this.findStatsByDate(yesterday, db);

    return db.platformStats.create({
      data: {
        date: getToday(),
        totalBusinesses: yesterdayStats?.totalBusinesses || 0,
        totalActiveSubscriptions: yesterdayStats?.totalActiveSubscriptions || 0,
        mrrTotal: yesterdayStats?.mrrTotal || 0,

        newBusinessesToday: 0,
        churnedBusinessesToday: 0,
        appointmentsToday: 0,
        revenueToday: 0,
        mrrLostToday: 0,
        costsToday: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
      },
    });
  }

  async ensureTodayStats(tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    const today = getToday();
    const stats = await this.findStatsByDate(today, db);
    if (!stats) {
      return this.createDailyStatsFromYesterday(db);
    }
    return stats;
  }

  async updateTodayStats(data: PlatformStatsUpdateInput, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    const today = getToday();
    return db.platformStats.update({
      where: { date: today },
      data,
    });
  }
}
