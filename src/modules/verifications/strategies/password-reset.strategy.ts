import { Injectable } from '@nestjs/common';
import { VerificationsService } from '../core/verifications.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { RequestResetPasswordParams } from '../types/verification.interface';

@Injectable()
export class PasswordResetStrategy {
  constructor(private readonly verificationsService: VerificationsService) {}

  async requestReset({ userId, email, name }: RequestResetPasswordParams) {
    const token = await this.verificationsService.createTokenVerification({
      userId,
      address: email,
      type: VerificationType.PASSWORD_RESET,
    });

    //send
    return { message: 'Hemos enviado un correo de verificación' };
  }

  async verifyResetToken(token: string) {
    return this.verificationsService.verifyToken(token);
  }
}
