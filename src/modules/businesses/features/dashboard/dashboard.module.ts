import { Module } from '@nestjs/common';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { BusinessStatsModule } from '../stats/business-stats.module';
import { BusinessQuotaModule } from '../quota/business-quota.module';
import { DashboardBusinessController } from './dashboard-business.controller';
import { DashboardBusinessService } from './dashboard-business.service';
import { DashboardAccessGuard } from './dashboard-access.guard';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [MembersModule, BusinessStatsModule, AppointmentsModule, BusinessQuotaModule],
  controllers: [DashboardBusinessController],
  providers: [DashboardBusinessService, DashboardAccessGuard],
})
export class DashboardModule {}
