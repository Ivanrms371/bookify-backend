import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { BusinessModule } from './modules/businesses/business.module';
import { PlanModule } from './modules/plans/plan.module';
import { PlatformStatsModule } from './modules/platform-stats/platform-stats.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { SubscriptionModule } from './modules/subscriptions/subscription.module';
import { VerificationModule } from './modules/verifications/verification.module';
import { WebhookModule } from './common/webhooks/webhook.module';
import { ServiceModule } from './modules/services/service.module';
import { InvitationModule } from './modules/invitations/invitation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    UserModule,
    BusinessModule,
    PlanModule,
    PaymentsModule,
    PlatformStatsModule,
    NotificationModule,
    SubscriptionModule,
    VerificationModule,
    WebhookModule,
    ServiceModule,
    InvitationModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
