import { Injectable } from '@nestjs/common';
import { VerificationsService } from '../core/verifications.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PhoneVerificationStrategy {
  constructor(
    private readonly verificationsService: VerificationsService,
    private readonly usersService: UsersService,
  ) {}

  async sendVerificationCode(userId: string, phone: string, tenantId: string) {
    const { code } = await this.verificationsService.createCodeVerification({
      userId,
      address: phone,
      type: VerificationType.PHONE_CONFIRM,
    });

    //send code to whatsapp

    return { message: 'Hemos enviado un código de verificación a tu Whatsapp' };
  }

  async verifyPhone(userId: string, code: string) {
    const verification = await this.verificationsService.verifyCode(userId, VerificationType.PHONE_CONFIRM, code);

    await this.usersService.markUserPhoneVerified(userId);

    return verification;
  }
}
