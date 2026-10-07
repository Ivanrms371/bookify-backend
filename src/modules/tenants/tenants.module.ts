import { Module } from '@nestjs/common';
import { MediaModule } from 'src/shared/media/media.module';
import { UsersModule } from 'src/modules/users/users.module';
import { TenantsController } from './tenants.controller';
import { TenantUsageModule } from './features/usage/tenant-usage.module';
import { TenantsService } from './tenants.service';
import { TenantsRepository } from './tenants.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [MediaModule, SubscriptionsModule, UsersModule, TenantUsageModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsRepository],
  exports: [TenantsService],
})
export class TenantsModule {}
