import { Module } from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';

import { SessionsModule } from 'src/auth/sessions/sessions.module';

@Module({
  imports: [SessionsModule],

  providers: [JwtAuthGuard, TenantGuard],

  exports: [JwtAuthGuard, TenantGuard],
})
export class SecurityModule {}
