import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SessionsModule } from 'src/auth/sessions/sessions.module';
import { AuthCallbackHandler } from './application/auth-callback.handler';
import { GoogleService } from './infrastructure/google/google.service';
import { GoogleMapper } from './infrastructure/google/google.mapper';
import { AuthService } from './application/auth.service';
import { VerificationsModule } from 'src/modules/verifications/verifications.module';
import { PasswordService } from './application/password.service';
import { UsersModule } from 'src/modules/users/users.module';
import { CookieModule } from 'src/shared/cookies/cookie.module';

@Module({
  imports: [CookieModule, UsersModule, SessionsModule, VerificationsModule],
  controllers: [AuthController],
  providers: [AuthService, AuthCallbackHandler, PasswordService, GoogleService, GoogleMapper],
})
export class AuthModule {}
