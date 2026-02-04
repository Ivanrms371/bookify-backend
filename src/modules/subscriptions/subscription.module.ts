import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PlanModule } from '../plans/plan.module';
import { SubscriptionController } from './controllers/subscriptions.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { SubscriptionService } from './services/subscription.service';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../users/user.module';
import { BusinessModule } from '../businesses/business.module';
import { MercadoPagoModule } from 'src/mercadopago/mercadopago.module';
import { MercadoPagoWebhookService } from './services/mercadopago-webhook.service';
import { PlatformStatsModule } from '../platform-stats/platform-stats.module';
import { PaymentsModule } from '../payments/payments.module';
import { WebhookModule } from 'src/common/webhooks/webhook.module';
import { StaffModule } from '../staffs/staff.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    PlanModule,
    MercadoPagoModule,
    PlatformStatsModule,
    PaymentsModule,
    WebhookModule,
    StaffModule,
    forwardRef(() => AuthModule),
    forwardRef(() => BusinessModule),
  ],
  controllers: [SubscriptionController, WebhooksController],
  providers: [SubscriptionService, MercadoPagoWebhookService, SubscriptionRepository],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
