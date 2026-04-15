import { Module } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { StaffGuard } from './staff.guard';

@Module({
  providers: [TenantGuard, PlatformAdminGuard, StaffGuard],
  exports: [TenantGuard, PlatformAdminGuard, StaffGuard],
})
export class GuardsModule {}
