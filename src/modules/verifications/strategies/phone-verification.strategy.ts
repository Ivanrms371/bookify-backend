import { Inject, Injectable } from '@nestjs/common';
import { BusinessNotifications } from 'src/modules/notifications/facades/business-notification';
import { VerificationService } from '../core/verification.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { UserService } from '../../users/services/user.service';

@Injectable()
export class PhoneVerificationStrategy {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly userService: UserService,
    private readonly businessNotifications: BusinessNotifications,
  ) {}

  async sendVerificationCode(userId: string, phone: string, businessId: string, ip: string) {
    const { code } = await this.verificationService.createCodeVerification({
      ip,
      userId,
      address: phone,
      type: VerificationType.PHONE_CONFIRM,
    });

    await this.businessNotifications.sendAuthOTP({
      userId,
      businessId,
      phone,
      code,
    });

    return { message: 'Hemos enviado un código de verificación a tu Whatsapp' };
  }

  async verifyPhone(userId: string, code: string) {
    const verification = await this.verificationService.verifyCode(
      userId,
      VerificationType.PHONE_CONFIRM,
      code,
    );

    await this.userService.markPhoneVerified(userId);

    return verification;
  }
}
