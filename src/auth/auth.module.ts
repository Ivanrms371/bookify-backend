import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SessionsModule } from 'src/auth/sessions/sessions.module';
import { AuthCallbackHandler } from './services/auth-callback.handler';
import { GoogleService } from './infrastructure/google/google.service';
import { GoogleMapper } from './infrastructure/google/google.mapper';
import { AuthService } from './services/auth.service';
import { VerificationsModule } from 'src/modules/verifications/verifications.module';
import { PasswordService } from './services/password.service';
import { UsersModule } from 'src/modules/users/users.module';
import { PermissionService } from './services/permission.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  imports: [UsersModule, SessionsModule, VerificationsModule],
  controllers: [AuthController],
  providers: [AuthService, AuthCallbackHandler, PasswordService, GoogleService, GoogleMapper, PermissionService, JwtAuthGuard, TenantGuard],
  exports: [JwtAuthGuard, TenantGuard, PermissionService, SessionsModule],
})
export class AuthModule {}
