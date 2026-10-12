import { Injectable } from '@nestjs/common';
import type { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import type { NotificationChannel } from 'src/generated/prisma/enums';
@Injectable()
export class VerificationPhoneTemplate implements NotificationTemplate {
  readonly type = 'verification.phoneNumber.created';
  build(channel: NotificationChannel, variables: { code: string }) {
    if (channel !== 'WHATSAPP') throw new Error('Unsupported verification channel');
    return { body: `Tu código de verificación de Turnify es ${variables.code}.` };
  }
}
