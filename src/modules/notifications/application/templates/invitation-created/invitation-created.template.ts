import { Injectable } from '@nestjs/common';
import { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import { BuildEmailResponse } from '../../../domain/templates/build-email.interface';
import { InvitationCreatedVariables } from './invitation-created.type';
import { NotificationChannel } from 'src/generated/prisma/enums';
import React from 'react';
import { render } from '@react-email/render';
import InvitationCreatedEmail from './InvitationCreatedEmail';

@Injectable()
export class InvitationCreatedTemplate implements NotificationTemplate {
  type = 'invitation.created';
  build(channel: NotificationChannel, payload: Record<string, any>): BuildEmailResponse | null {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(payload as InvitationCreatedVariables);
      case NotificationChannel.IN_APP:
        throw new Error(`Channel not supported for ${this.type}`);
      case NotificationChannel.WHATSAPP:
        throw new Error(`Channel not supported for ${this.type}`);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(payload: InvitationCreatedVariables): BuildEmailResponse {
    return {
      subject: `Te han invitado a unirte a ${payload.tenantName} en Turnify`,
      react: InvitationCreatedEmail(payload),
    };
  }
}
