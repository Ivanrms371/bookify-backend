import { Module } from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import { PermissionsGuard } from './guards/permissions.guard';

import { SessionsModule } from 'src/auth/sessions/sessions.module';

@Module({
  imports: [SessionsModule],

  providers: [JwtAuthGuard, TenantGuard, PermissionsGuard],

  exports: [JwtAuthGuard, TenantGuard, PermissionsGuard],
})
export class SecurityModule {}
