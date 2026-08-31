import { Module } from '@nestjs/common';
import { MediaModule } from 'src/shared/media/media.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TenantsController } from './tenants.controller';
import { TenantUsageModule } from './features/usage/tenant-usage.module';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './repositories/tenants.repository.js';
import { StatsModule } from 'src/common/stats/stats.module';
import { AuthModule } from 'src/auth/auth.module';
import { PublicTenantsController } from './public-tenants.controller';
import { PublicTenantsService } from './public-tenants.service';
import { PublicTenantsRepository } from './repositories/public-tenants.repository';

@Module({
  imports: [AuthModule, MediaModule, UsersModule, PlansModule, StatsModule, TenantUsageModule],
  controllers: [TenantsController, PublicTenantsController],
  providers: [TenantsService, TenantsRepository, PublicTenantsService, PublicTenantsRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
