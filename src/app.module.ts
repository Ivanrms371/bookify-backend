import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CloudinaryModule } from './shared/integrations/cloudinary/cloudinary.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { PlansModule } from './modules/plans/plans.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsModule } from './modules/payments/payments.module';
import { VerificationsModule } from './modules/verifications/verifications.module';
import { WebhookModule } from './common/webhooks/webhook.module';
import { CookieModule } from './shared/cookies/cookie.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ServicesModule } from './modules/services/services/services.module';
import { StaffsModule } from './modules/staffs/staffs.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InvitationsModule } from './modules/businesses/features/invitations/invitations.module';
import { BusinessQuotaModule } from './modules/businesses/features/quota/business-quota.module';
import { MembersModule } from './modules/businesses/features/members/members.module';
import { BusinessOnboardingModule } from './modules/businesses/features/onboarding/business-onboarding.module';
import { SettingsModule } from './modules/businesses/features/settings/settings.module';
import { BusinessStatsModule } from './modules/businesses/features/stats/business-stats.module';
import { ServiceAssignmentsModule } from './modules/services/service-assigments/service-assignments.module';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { DashboardModule } from './modules/businesses/features/dashboard/dashboard.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtModule } from './auth/infrastructure/jwt/jwt.module';
import { GuardsModule } from './common/guards/guards.module';
import { MediaModule } from './shared/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    CloudinaryModule,
    CookieModule,
    MediaModule,
    InfrastructureModule,
    PrismaModule,
    GuardsModule,
    JwtModule,
    AuthModule,
    AppointmentsModule,
    InvitationsModule,
    BusinessQuotaModule,
    MembersModule,
    BusinessOnboardingModule,
    SettingsModule,
    BusinessStatsModule,
    AvailabilityModule,
    BusinessesModule,
    CustomersModule,
    PlansModule,
    NotificationsModule,
    PaymentsModule,
    ServicesModule,
    ServiceAssignmentsModule,
    StaffsModule,
    SubscriptionsModule,
    UsersModule,
    VerificationsModule,
    WebhookModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
