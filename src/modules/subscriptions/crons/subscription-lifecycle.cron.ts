import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays, differenceInDays, endOfDay, startOfDay } from 'date-fns';
import { SubscriptionRepository } from '../repositories/subscription.repository';

@Injectable()
export class SubscriptionLifecycleCron {
  private readonly logger = new Logger(SubscriptionLifecycleCron.name);
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    timeZone: 'America/Montevideo',
  })
  async handleLifecycleCheck() {
    this.logger.log('Starting subscription lifecycle check');

    const today = startOfDay(new Date());
    const ranges = [0, 3, 7].map((d) => ({
      start: startOfDay(addDays(today, d)),
      end: endOfDay(addDays(today, d)),
    }));

    const subs = await this.subscriptionRepository.findSubscriptionsForLifecycle(ranges);

    for (const sub of subs) {
      await this.process(sub);
    }
  }

  private async process(sub: any) {
    switch (sub.status) {
      case 'TRIAL':
        await this.handleTrial(sub);
        break;
      case 'ACTIVE':
        await this.handleRenewal(sub);
        break;
    }
  }

  private async handleTrial(sub: any) {
    const daysDiff = differenceInDays(sub.trialEndsAt, new Date());

    if (daysDiff < 0) return;
  }

  private async handleRenewal(sub: any) {
    const daysDiff = differenceInDays(sub.nextBillingDate, new Date());

    // send
  }
}
