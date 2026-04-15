import { Injectable } from '@nestjs/common';
import { NotificationTemplate } from 'src/modules/notifications/domain/templates/notification-template.interface';
import { TenantCreatedVariables } from './tenant-created.type';
import { NotificationChannel } from 'src/generated/prisma/enums';

@Injectable()
export class TenantCreatedTemplate implements NotificationTemplate {
  type = 'tenant.created';

  build(channel: NotificationChannel, payload: TenantCreatedVariables) {
    switch (channel) {
      case NotificationChannel.EMAIL:
        throw new Error(`Channel not supported fot ${this.type}`);
      case NotificationChannel.IN_APP:
        return this.buildInApp(payload);
      case NotificationChannel.WHATSAPP:
        throw new Error(`Channel not supported fot ${this.type}`);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildInApp(variables: TenantCreatedVariables) {
    return {
      title: `Bienvenido ${variables.userName}, ya eres parte de Bookify! 👋`,
      message: `Empieza ahora a configurar ${variables.tenantName} y a gestionar tus citas y clientes de manera eficiente.`,
    };
  }
}
