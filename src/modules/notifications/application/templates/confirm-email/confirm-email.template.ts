import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { VerificationEmailEmailTemplate } from './email.template';
import { ConfirmEmailVariables } from './confirm-email.type';
import { BuildEmailResponse } from 'src/modules/notifications/domain/templates/build-email.interface';

@Injectable()
export class VerificationEmailTemplate implements NotificationTemplate {
  type = 'verification.email.created';

  build(channel: NotificationChannel, variables: ConfirmEmailVariables): BuildEmailResponse | any {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(variables);
      case NotificationChannel.IN_APP:
        throw new Error(`Channel not supported for ${this.type}`);
      case NotificationChannel.WHATSAPP:
        throw new Error(`Channel not supported for ${this.type}`);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(variables: ConfirmEmailVariables): BuildEmailResponse {
    return {
      subject: `Confirma tu correo electrónico en Turnify`,
      react: VerificationEmailEmailTemplate(variables),
    };
  }
}
