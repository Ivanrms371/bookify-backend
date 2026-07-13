import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './shared/prisma/prisma.module';
import { CloudinaryModule } from './shared/integrations/cloudinary/cloudinary.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PlansModule } from './modules/plans/plans.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsModule } from './modules/payments/payments.module';
import { VerificationsModule } from './modules/verifications/verifications.module';
import { WebhookModule } from './common/webhooks/webhook.module';
import { CookieModule } from './shared/cookies/cookie.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TenantUsageModule } from './modules/tenants/features/usage/tenant-usage.module';
import { SettingsModule } from './modules/tenants/features/settings/settings.module';
import { InfrastructureModule } from './shared/infrastructure/infrastructure.module';
import { DashboardModule } from './modules/tenants/features/dashboard/dashboard.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { JwtModule } from './auth/infrastructure/jwt/jwt.module';
import { MediaModule } from './shared/media/media.module';
import { GuardsModule } from './common/guards/guards.module';
import { MembershipsModule } from './modules/tenants/features/memberships/memberships.module';
import { StatsModule } from './common/stats/stats.module';
import { CustomersModule } from './modules/tenants/features/customers/customers.module';
import { EmployeesModule } from './modules/tenants/features/employees/employees.module';
import { TenantReportsModule } from './modules/tenants/features/reports/tenant-reports.module';
import { ServicesModule } from './modules/tenants/features/services/services/services.module';
import { ServiceAssignmentsModule } from './modules/tenants/features/services/service-assigments/service-assignments.module';
import { PortalModule } from './modules/portal/portal.module';
import { TenantOnboardingModule } from './modules/tenants/features/onboarding/onboarding.module';
import { TenantWorkingHoursModule } from './modules/tenants/features/working-hours/tenant-working.hours.module';

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
    StatsModule,
    GuardsModule,
    JwtModule,
    AuthModule,
    AppointmentsModule,
    PortalModule,
    TenantUsageModule,
    TenantReportsModule,
    MembershipsModule,
    SettingsModule,
    AvailabilityModule,
    TenantsModule,
    TenantWorkingHoursModule,
    TenantOnboardingModule,
    CustomersModule,
    PlansModule,
    NotificationsModule,
    PaymentsModule,
    ServicesModule,
    ServiceAssignmentsModule,
    EmployeesModule,
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
