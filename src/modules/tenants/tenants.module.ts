import { Module } from '@nestjs/common';
import { MediaModule } from 'src/shared/media/media.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TenantsController } from './tenants.controller';
import { TenantQuotaModule } from './features/quota/tenant-quota.module';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './repositories/tenants.repository.js';
import { StatsModule } from 'src/common/stats/stats.module';
import { TenantWorkingHoursController } from './features/working-hours/tenant-working-hours.controller';
import { TenantWorkingHoursService } from './features/working-hours/tenant-working-hours.service';
import { TenantWorkingHoursRepository } from './features/working-hours/tenant-working-hours.repository';
import { MembershipsModule } from './features/memberships/memberships.module';

@Module({
  imports: [
    MediaModule,
    MembershipsModule,
    UsersModule,
    PlansModule,
    StatsModule,
    TenantQuotaModule,
  ],

  controllers: [TenantsController, TenantWorkingHoursController],
  providers: [TenantsService, TenantsRepository, TenantWorkingHoursService, TenantWorkingHoursRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
