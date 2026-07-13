import { Injectable } from '@nestjs/common';
import { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import { BuildEmailResponse } from '../../../domain/templates/build-email.interface';
import { MembershipInvitedVariables } from './membership-invited.type';
import { NotificationChannel } from 'src/generated/prisma/enums';
import React from 'react';
import { render } from '@react-email/render';
import MembershipInvitedEmail from '../_components/MembershipInvitedEmail';

@Injectable()
export class MembershipInvitedTemplate implements NotificationTemplate {
  type = 'membership.invited';
  private readonly baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  build(channel: NotificationChannel, payload: Record<string, any>): BuildEmailResponse | null {

    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.buildEmail(payload as MembershipInvitedVariables);
      case NotificationChannel.IN_APP:
        throw new Error(`Channel not supported for ${this.type}`);
      case NotificationChannel.WHATSAPP:
        throw new Error(`Channel not supported for ${this.type}`);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  private buildEmail(payload: MembershipInvitedVariables): BuildEmailResponse {
    return {
      subject: `Te han invitado a unirte a ${payload.tenantName} en Turnify`,
      react: MembershipInvitedEmail(payload),
    };
  }
}
