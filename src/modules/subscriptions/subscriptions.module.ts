import { Module } from '@nestjs/common';
import { PlansModule } from 'src/modules/plans/plans.module';
import { MercadoPagoModule } from 'src/shared/integrations/mercadopago/mercadopago.module';
import { WebhookModule } from 'src/common/webhooks/webhook.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, PlansModule, MercadoPagoModule, WebhookModule, NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsRepository],
})
export class SubscriptionsModule {}
