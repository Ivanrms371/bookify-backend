import { Inject, Injectable } from '@nestjs/common';
import { VerificationService } from '../core/verification.service';
import { UserService } from '../../users/services/user.service';
import { PlatformNotifications } from 'src/modules/notifications/facades/platform-notification';
import { VerificationType } from 'src/generated/prisma/enums';
import { SendVerificationEmailParams } from '../types/verification.interface';

@Injectable()
export class EmailVerificationStrategy {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly userService: UserService,
    private readonly platformNotifications: PlatformNotifications,
  ) {}

  async sendVerificationEmail({ userId, email, name, ip }: SendVerificationEmailParams) {
    const { token } = await this.verificationService.createTokenVerification({
      ip,
      userId,
      type: VerificationType.EMAIL_CONFIRM,
      address: email,
    });

    await this.platformNotifications.sendAccountConfirmation({
      userId,
      name,
      email,
      token,
    });

    return { message: 'Hemos enviado un correo de verificación' };
  }

  async confirmEmail(token: string) {
    const verification = await this.verificationService.verifyToken(token);

    const user = await this.userService.markEmailVerified(verification.userId);

    return user;
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.findByEmailOrFail(email);

    const verification = await this.verificationService.resendCode({
      userId: user.id,
      type: VerificationType.EMAIL_CONFIRM,
      address: email,
    });

    this.platformNotifications.sendAccountConfirmation({
      userId: user.id,
      name: user.name,
      token: verification.token,
      email,
    });

    return { message: 'Hemos enviado un nuevo correo de verificación' };
  }
}
