import { Module } from '@nestjs/common';
import { MediaModule } from 'src/shared/media/media.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TenantsController } from './tenants.controller';
import { TenantUsageModule } from './features/usage/tenant-usage.module';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './repositories/tenants.repository.js';
import { StatsModule } from 'src/common/stats/stats.module';
import { TenantWorkingHoursService } from './features/working-hours/tenant-working-hours.service';
import { TenantWorkingHoursRepository } from './features/working-hours/tenant-working-hours.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, MediaModule, UsersModule, PlansModule, StatsModule, TenantUsageModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsRepository, TenantWorkingHoursService, TenantWorkingHoursRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
