import { Module, forwardRef } from '@nestjs/common';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './core/verifications.service';
import { VerificationsRepository } from './repositories/verifications.repository';
import { VerificationLocksService } from './core/verification-locks.service';
import { VerificationLocksRepository } from './repositories/verification-locks.repository';
import { CodeGeneratorService } from './core/code-generator.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { EmailVerificationStrategy } from './strategies/email-verification.strategy';
import { PasswordResetStrategy } from './strategies/password-reset.strategy';
import { PhoneVerificationStrategy } from './strategies/phone-verification.strategy';
import { UserCreatedListener } from './listeners/user-created.listener';

@Module({
  imports: [PrismaModule, NotificationsModule, UsersModule],
  controllers: [VerificationsController],
  providers: [
    // Core
    VerificationsService,
    VerificationLocksService,

    // Strategies
    EmailVerificationStrategy,
    PasswordResetStrategy,
    PhoneVerificationStrategy,

    // Repositories
    VerificationsRepository,
    VerificationLocksRepository,

    // Utils
    CodeGeneratorService,

    // Listeners
    UserCreatedListener,
  ],
  exports: [EmailVerificationStrategy, PasswordResetStrategy, PhoneVerificationStrategy],
})
export class VerificationsModule {}
