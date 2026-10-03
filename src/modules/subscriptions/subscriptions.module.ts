import { SubscriptionWebhookService } from './subscription-webhook.service';
import { PaymentsModule } from '../payments/payments.module';
import { Module } from '@nestjs/common';
import { WebhookModule } from 'src/common/webhooks/webhook.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansService } from './plans.service';
import { LemonSqueezyModule } from 'src/shared/integrations/lemon-squeezy/lemon-squeezy.module';

@Module({
  imports: [PaymentsModule, LemonSqueezyModule, WebhookModule, NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionWebhookService, SubscriptionsService, PlansService, SubscriptionsRepository],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
