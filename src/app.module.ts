import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CloudinaryModule } from './shared/integrations/cloudinary/cloudinary.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PlansModule } from './modules/plans/plans.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { VerificationsModule } from './modules/verifications/verifications.module';
import { WebhookModule } from './common/webhooks/webhook.module';
import { CookieModule } from './shared/cookies/cookie.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TenantUsageModule } from './modules/tenants/features/usage/tenant-usage.module';
import { SettingsModule } from './modules/tenants/features/settings/settings.module';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { JwtModule } from './auth/infrastructure/jwt/jwt.module';
import { MediaModule } from './shared/media/media.module';
import { StatsModule } from './common/stats/stats.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ServicesModule } from './modules/services/services.module';
import { TenantOnboardingModule } from './modules/tenants/features/onboarding/onboarding.module';
import { ProfessionalsModule } from './modules/professional/professionals.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { ScheduleModule } from './modules/schedule/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NestScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    CloudinaryModule,
    CookieModule,
    MediaModule,
    InfrastructureModule,
    PrismaModule,
    StatsModule,
    JwtModule,
    AuthModule,
    TenantUsageModule,
    AppointmentsModule,
    DashboardModule,
    InvitationsModule,
    SettingsModule,
    AvailabilityModule,
    TenantsModule,
    TenantOnboardingModule,
    CustomersModule,
    PlansModule,
    NotificationsModule,
    PaymentsModule,
    ServicesModule,
    ProfessionalsModule,
    SubscriptionsModule,
    UsersModule,
    VerificationsModule,
    WebhookModule,
    MembershipsModule,
    ScheduleModule,
  ],
})
export class AppModule {}
