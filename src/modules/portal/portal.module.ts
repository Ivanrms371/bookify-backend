import { Module } from '@nestjs/common';
import { DashboardPortalController } from './infrastructure/controllers/dashboard-portal.controller';
import { LayoutPortalController } from './infrastructure/controllers/layout-portal.controller';
import { DashboardPortalService } from './application/dashboard-portal.service';
import { LayoutPortalService } from './application/layout-portal.service';
import { TenantStatsModule } from '../tenants/features/stats/tenant-stats.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { TenantUsageModule } from '../tenants/features/usage/tenant-usage.module';

@Module({
  imports: [TenantStatsModule, AppointmentsModule, TenantUsageModule],
  controllers: [DashboardPortalController, LayoutPortalController],
  providers: [DashboardPortalService, LayoutPortalService],
})
export class PortalModule {}
