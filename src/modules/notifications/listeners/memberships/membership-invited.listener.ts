import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../application/services/notifications.service';
import { OnEvent } from '@nestjs/event-emitter';
import { RecipientType } from 'src/generated/prisma/enums';
import { MembershipInvitedEvent } from 'src/modules/tenants/events/membership-invited.event';
import { MembershipInvitedVariables } from '../../application/templates/membership-invited/membership-invited.type';

@Injectable()
export class MembershipInvitedListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('membership.invited')
  async handleMembershipInvited(event: MembershipInvitedEvent) {
    const { tenantId, userId, email, token, role, tenantName } = event;
    const inviteLink = `${process.env.APP_URL}/auth/invite?token=${token}`;
    await this.notificationsService.create({
      type: 'membership.invited',
      tenantId,
      recipientId: userId,
      recipientType: RecipientType.USER,
      payload: {
        tenantName,
        email,
        inviteLink,
        role,
      } as MembershipInvitedVariables,
    });
  }
}
