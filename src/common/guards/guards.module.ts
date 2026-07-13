import { Module } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { PlatformAdminGuard } from './platform-admin.guard';
import { EmployeeGuard } from './employee.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  providers: [JwtAuthGuard, TenantGuard, PlatformAdminGuard, EmployeeGuard],
  exports: [JwtAuthGuard, TenantGuard, PlatformAdminGuard, EmployeeGuard],
})
export class GuardsModule {}
