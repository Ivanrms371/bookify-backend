import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../application/services/notifications.service';
import { OnEvent } from '@nestjs/event-emitter';
import { RecipientType } from 'src/generated/prisma/enums';
import { TenantCreatedEvent } from 'src/modules/tenants/events/tenant-created.event';
import { TenantCreatedVariables } from '../../application/templates/tenant-created/tenant-created.type';

@Injectable()
export class TenantCreatedListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('tenant.created')
  async handleTenantCreated(event: TenantCreatedEvent) {
    const { tenantId, userId } = event;
    await this.notificationsService.create({
      type: 'tenant.created',
      tenantId,
      recipientId: userId,
      recipientType: RecipientType.USER,
      payload: {
        tenantName: event.tenantName,
        userName: event.userName,
      },
    });
  }
}
