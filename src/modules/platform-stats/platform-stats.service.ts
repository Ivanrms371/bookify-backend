import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Prisma, Subscription, SubscriptionStatus } from 'src/generated/prisma/client';
import { getToday } from 'src/common/utils/dates.util';
import { PlatformStatsRepository } from './platform-stats.repository';
import { isChurnStatus } from 'src/common/helpers/churn-status.helper';

@Injectable()
export class PlatformStatsService {
  constructor(private readonly platformStatsRepository: PlatformStatsRepository) {}

  async createDailyStats() {
    const today = getToday();
    const existingStats = await this.platformStatsRepository.findStatsByDate(today);
    if (existingStats) {
      return;
    }

    await this.platformStatsRepository.createDailyStatsFromYesterday();
  }

  async handleSubscriptionEvents(
    event: {
      subscription: Subscription;
      currentStatus: SubscriptionStatus;
      previousStatus: SubscriptionStatus;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const todayStats = await this.platformStatsRepository.ensureTodayStats(tx);

    const { subscription, currentStatus, previousStatus } = event;

    const amount = new Decimal(subscription.amount);

    if (
      previousStatus !== SubscriptionStatus.ACTIVE &&
      currentStatus === SubscriptionStatus.ACTIVE
    ) {
      todayStats.totalActiveSubscriptions += 1;
      todayStats.revenueToday = todayStats.revenueToday.add(amount);
      todayStats.mrrTotal = todayStats.mrrTotal.add(amount);
    }
    if (
      previousStatus === SubscriptionStatus.ACTIVE &&
      currentStatus === SubscriptionStatus.ACTIVE
    ) {
      todayStats.revenueToday = todayStats.revenueToday.add(amount);
    }

    if (previousStatus === SubscriptionStatus.ACTIVE && isChurnStatus(currentStatus)) {
      todayStats.churnedBusinessesToday += 1;
      todayStats.totalActiveSubscriptions -= 1;
      todayStats.mrrLostToday = todayStats.mrrLostToday.add(amount);
      todayStats.mrrTotal = todayStats.mrrTotal.sub(amount);
    }
    return await this.platformStatsRepository.updateTodayStats(todayStats, tx);
  }
}
