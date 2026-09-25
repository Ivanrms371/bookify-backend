import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SessionsModule } from 'src/auth/sessions/sessions.module';
import { AuthCallbackHandler } from './services/auth-callback.handler';
import { GoogleService } from './infrastructure/google/google.service';
import { GoogleMapper } from './infrastructure/google/google.mapper';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { UsersModule } from 'src/modules/users/users.module';
import { InvitationsModule } from 'src/modules/invitations/invitations.module';
import { VerificationsModule } from 'src/modules/verifications/verifications.module';

@Module({
  imports: [UsersModule, SessionsModule, VerificationsModule, forwardRef(() => InvitationsModule)],
  controllers: [AuthController],
  providers: [AuthService, AuthCallbackHandler, PasswordService, GoogleService, GoogleMapper],
})
export class AuthModule {}
