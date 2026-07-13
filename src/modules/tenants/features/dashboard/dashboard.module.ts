import { Module } from '@nestjs/common';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { DashboardTenantController } from './dashboard-tenant.controller';
import { DashboardAccessGuard } from './dashboard-access.guard';
import { DashboardTenantService } from './dashboard-tenant.service';
import { StatsModule } from 'src/common/stats/stats.module';
import { TenantUsageModule } from '../usage/tenant-usage.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { EmployeesModule } from 'src/modules/tenants/features/employees/employees.module';
import { EmployeeStatsModule } from 'src/modules/tenants/features/employees/features/stats/employee-stats.module';

@Module({
  imports: [MembershipsModule, StatsModule, AppointmentsModule, TenantUsageModule, EmployeesModule, EmployeeStatsModule],

  controllers: [DashboardTenantController],
  providers: [DashboardTenantService, DashboardAccessGuard],
})
export class DashboardModule {}
