import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../application/services/notifications.service';
import { OnEvent } from '@nestjs/event-emitter';
import { RecipientType } from 'src/generated/prisma/enums';
import { InvitationCreatedEvent } from 'src/modules/tenants/events/invitation-created.event';
import { InvitationCreatedVariables } from '../../application/templates/invitation-created/invitation-created.type';

@Injectable()
export class InvitationCreatedListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('invitation.created')
  async handle(event: InvitationCreatedEvent) {
    const { tenantId, userId, email, token, role, tenantName } = event;
    const inviteLink = `${process.env.APP_URL}/auth/signup?token=${token}`;
    await this.notificationsService.create({
      type: 'invitation.created',
      tenantId,
      recipientId: userId,
      recipientType: RecipientType.USER,
      payload: {
        tenantName,
        email,
        inviteLink,
        role,
      },
    });
  }
}
