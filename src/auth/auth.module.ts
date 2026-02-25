import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { SessionsModule } from 'src/auth/sessions/sessions.module';
import { AuthCallbackHandler } from './application/auth-callback.handler';
import { AuthCookieService } from './infrastructure/cookies/auth-cookie.service';
import { GoogleService } from './infrastructure/google/google.service';
import { GoogleMapper } from './infrastructure/google/google.mapper';
import { AuthService } from './application/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { BusinessGuard } from './guards/business.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { JwtService } from './infrastructure/jwt/jwt.service';
import { UsersModule } from 'src/modules/users/users.module';
import { VerificationsModule } from 'src/modules/verifications/verifications.module';
import { PasswordService } from './application/password.service';
import { MembersModule } from 'src/modules/businesses/features/members/members.module';

@Module({
  imports: [PrismaModule, SessionsModule, MembersModule, UsersModule, forwardRef(() => VerificationsModule)],
  controllers: [AuthController],
  providers: [
    // application
    AuthService,
    AuthCallbackHandler,
    PasswordService,

    // infrastructure
    AuthCookieService,
    GoogleService,
    GoogleMapper,
    JwtService,

    // guards
    JwtAuthGuard,
    BusinessGuard,
    PlatformAdminGuard,
  ],
  exports: [AuthCookieService, JwtService, JwtAuthGuard, BusinessGuard, PlatformAdminGuard],
})
export class AuthModule {}
