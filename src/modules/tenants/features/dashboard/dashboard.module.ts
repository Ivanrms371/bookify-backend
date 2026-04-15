import { Module } from '@nestjs/common';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { DashboardTenantController } from './dashboard-tenant.controller';
import { DashboardAccessGuard } from './dashboard-access.guard';
import { DashboardTenantService } from './dashboard-tenant.service';
import { StatsModule } from 'src/common/stats/stats.module';
import { TenantQuotaModule } from '../quota/tenant-quota.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { StaffsModule } from 'src/modules/tenants/features/staffs/staffs.module';

@Module({
  imports: [MembershipsModule, StatsModule, AppointmentsModule, TenantQuotaModule, StaffsModule],

  controllers: [DashboardTenantController],
  providers: [DashboardTenantService, DashboardAccessGuard],
})
export class DashboardModule {}
