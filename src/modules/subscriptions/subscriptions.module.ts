import { Module } from '@nestjs/common';
import { PlansModule } from 'src/modules/plans/plans.module';
import { SubscriptionController } from './controllers/subscriptions.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { MercadoPagoModule } from 'src/shared/integrations/mercadopago/mercadopago.module';
import { MercadoPagoWebhookService } from './services/mercadopago-webhook.service';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { WebhookModule } from 'src/common/webhooks/webhook.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { SubscriptionLifecycleCron } from './crons/subscription-lifecycle.cron';
import { GuardsModule } from 'src/common/guards/guards.module';
import { MembershipsModule } from 'src/modules/tenants/features/memberships/memberships.module';

@Module({
  imports: [GuardsModule, MembershipsModule, PlansModule, MercadoPagoModule, PaymentsModule, WebhookModule, NotificationsModule],
  controllers: [SubscriptionController, WebhooksController],
  providers: [SubscriptionService, MercadoPagoWebhookService, SubscriptionRepository, SubscriptionLifecycleCron],
  exports: [SubscriptionService],
})
export class SubscriptionsModule {}
