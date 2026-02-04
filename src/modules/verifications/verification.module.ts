import { Module, forwardRef } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './core/verification.service';
import { VerificationRepository } from './repositories/verification.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../users/user.module';
import { VerificationLockService } from './core/verification-lock.service';
import { CodeGeneratorService } from './core/code-generator.service';
import { VerificationLockRepository } from './repositories/verification-lock.repository';
import { EmailVerificationStrategy } from './strategies/email-verification.strategy';
import { PasswordResetStrategy } from './strategies/password-reset.strategy';
import { PhoneVerificationStrategy } from './strategies/phone-verification.strategy';

@Module({
  imports: [PrismaModule, NotificationModule, UserModule, forwardRef(() => AuthModule)],
  controllers: [VerificationController],
  providers: [
    // Core
    VerificationService,
    VerificationLockService,

    // Strategies
    EmailVerificationStrategy,
    PasswordResetStrategy,
    PhoneVerificationStrategy,

    // Repositories
    VerificationRepository,
    VerificationLockRepository,

    // Utils
    CodeGeneratorService,
  ],
  exports: [EmailVerificationStrategy, PasswordResetStrategy, PhoneVerificationStrategy],
})
export class VerificationModule {}
