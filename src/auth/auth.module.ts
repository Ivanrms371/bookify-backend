import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './services/jwt.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/modules/users/user.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { BusinessModule } from 'src/modules/businesses/business.module';
import { VerificationModule } from 'src/modules/verifications/verification.module';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { MagicLinkService } from './services/magic-link.service';
import { OtpService } from './services/otp.service';
import { OtpRepository } from './repositories/otp.repository';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    forwardRef(() => BusinessModule),
    forwardRef(() => VerificationModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    JwtAuthGuard,
    RefreshTokenRepository,
    PasswordService,
    SessionService,
    RefreshTokenService,
    MagicLinkService,
    OtpService,
    OtpRepository,
  ],
  exports: [
    AuthService,
    JwtService,
    JwtAuthGuard,
    RefreshTokenRepository,
    PasswordService,
    SessionService,
    RefreshTokenService,
    MagicLinkService,
    OtpService,
    OtpRepository,
  ],
})
export class AuthModule {}
