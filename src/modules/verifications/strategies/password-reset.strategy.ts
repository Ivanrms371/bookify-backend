import { Injectable } from '@nestjs/common';
import { PlatformNotifications } from 'src/modules/notifications/facades/platform-notification';
import { VerificationService } from '../core/verification.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { UserService } from '../../users/services/user.service';

@Injectable()
export class PasswordResetStrategy {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly userService: UserService,
    private readonly platformNotifications: PlatformNotifications,
  ) {}

  async requestReset(email: string, ip?: string) {
    const user = await this.userService.findByEmailOrFail(email);
    const userId = user.id;
    const name = user.name;

    const { token } = await this.verificationService.createTokenVerification({
      ip,
      userId,
      address: email,
      type: VerificationType.PASSWORD_RESET,
    });

    await this.platformNotifications.sendPasswordReset({
      userId,
      name,
      email,
      token,
    });

    return { message: 'Hemos enviado un correo de verificación' };
  }

  async verifyResetToken(token: string) {
    return this.verificationService.verifyToken(token);
  }
}
