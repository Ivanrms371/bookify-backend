import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { SubscriptionsRepository } from './subscriptions.repository';
@Injectable()
export class PlanChangeScheduler {
  constructor(private readonly repository: SubscriptionsRepository) {}
  @Interval(60_000)
  applyDueChanges() {
    return this.repository.applyDuePlanChanges();
  }
}
