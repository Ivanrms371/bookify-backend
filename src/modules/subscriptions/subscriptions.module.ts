import { NotificationsModule } from '../notifications/notifications.module';
import { BillingNoticePlanner } from './schedulers/billing-notice-planner.service';
import { BillingNoticeRepository } from './repositories/billing-notice.repository';
import { BillingNoticeStateService } from './billing-notice-state.service';
import { TenantUsageModule } from '../tenants/features/usage/tenant-usage.module';
import { PlanChangeService } from './plan-change.service';
import { PlanChangeScheduler } from './plan-change.scheduler';
import { SubscriptionWebhookService } from './subscription-webhook.service';
import { PaymentsModule } from '../payments/payments.module';
import { Module } from '@nestjs/common';
import { WebhookModule } from 'src/common/webhooks/webhook.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansService } from './plans.service';
import { LemonSqueezyModule } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.module';

@Module({
  imports: [NotificationsModule, TenantUsageModule, PaymentsModule, LemonSqueezyModule, WebhookModule],
  controllers: [SubscriptionsController],
  providers: [
    BillingNoticePlanner,
    BillingNoticeRepository,
    BillingNoticeStateService,
    PlanChangeService,
    PlanChangeScheduler,
    SubscriptionWebhookService,
    SubscriptionsService,
    PlansService,
    SubscriptionsRepository,
  ],
  exports: [SubscriptionsService, BillingNoticeStateService],
})
export class SubscriptionsModule {}
