import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { SubscriptionController } from './controllers/subscriptions.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { MercadoPagoModule } from 'src/mercadopago/mercadopago.module';
import { MercadoPagoWebhookService } from './services/mercadopago-webhook.service';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { WebhookModule } from 'src/common/webhooks/webhook.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { SubscriptionLifecycleCron } from './crons/subscription-lifecycle.cron';
import { MembersModule } from 'src/modules/businesses/features/members/members.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    MembersModule,
    PlansModule,
    MercadoPagoModule,
    PaymentsModule,
    WebhookModule,
    NotificationsModule,
  ],
  controllers: [SubscriptionController, WebhooksController],
  providers: [SubscriptionService, MercadoPagoWebhookService, SubscriptionRepository, SubscriptionLifecycleCron],
  exports: [SubscriptionService],
})
export class SubscriptionsModule {}
