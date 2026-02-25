import { Inject, Injectable } from '@nestjs/common';
import { VerificationsService } from '../core/verifications.service';
import { UsersService } from '../../users/users.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { SendVerificationEmailParams } from '../types/verification.interface';

@Injectable()
export class EmailVerificationStrategy {
  constructor(
    private readonly userService: UsersService,
    private readonly verificationsService: VerificationsService,
  ) {}

  async sendVerificationEmail({ userId, email, name }: SendVerificationEmailParams) {
    const token = await this.verificationsService.createTokenVerification({
      userId,
      type: VerificationType.EMAIL_CONFIRM,
      address: email,
    });

    //end
    return { message: 'Hemos enviado un correo de verificación' };
  }

  async confirmEmail(token: string) {
    const verification = await this.verificationsService.verifyToken(token);
    const user = await this.userService.markUserEmailVerified(verification.userId);
    return user;
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userService.findUserByEmailOrFail(email);

    const token = await this.verificationsService.resendCode({
      userId: user.id,
      type: VerificationType.EMAIL_CONFIRM,
      address: email,
    });

    //resend email

    return { message: 'Hemos enviado un nuevo correo de verificación' };
  }
}
