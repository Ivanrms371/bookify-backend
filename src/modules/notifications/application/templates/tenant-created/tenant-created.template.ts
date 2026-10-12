import { Injectable } from '@nestjs/common';
import type { NotificationChannel } from 'src/generated/prisma/enums';
import type { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import type { TenantCreatedVariables } from './tenant-created.type';
import { TenantCreatedEmail } from './email.template';

@Injectable()
export class TenantCreatedTemplate implements NotificationTemplate {
  readonly type = 'tenant.created';
  build(channel: NotificationChannel, v: TenantCreatedVariables) {
    const title = '¡Bienvenido a Bookify!';
    const message = 'Tu negocio ya está listo. Entrá y empezá a organizar tu agenda y gestionar tus citas desde un solo lugar.';
    if (channel === 'EMAIL') return { subject: title, react: TenantCreatedEmail(v, message) };
    if (channel === 'IN_APP')
      return {
        title,
        message: 'Qué bueno tenerte acá. Todo listo para empezar a gestionar tu agenda y tus citas.',
      };
    throw new Error(`Unsupported channel for ${this.type}: ${channel}`);
  }
}
