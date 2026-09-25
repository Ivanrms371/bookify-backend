import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';

export interface VerificationCreatedEvent {
  verificationId: string;
  type: VerificationType;
  recipientId: string;
  recipientType: RecipientType;
  token?: string;
  code?: string;
  expiresAt: Date;
  tenantId?: string;
}

@Injectable()
export class VerificationCreatedListener {
  private readonly frontendUrl: string;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  @OnEvent('verification.created', { async: true })
  async handle(event: VerificationCreatedEvent) {
    if (event.token) {
      const magicLink = `${this.frontendUrl}/verify?token=${event.token}&type=${event.type}`;

      await this.notificationsService.create({
        type: 'verification.email.created',
        recipientId: event.recipientId,
        recipientType: event.recipientType,
        tenantId: event.tenantId,
        payload: {
          magicLink,
          recipientId: event.recipientId,
        },
      });

      return;
    }

    if (event.code) {
      await this.notificationsService.create({
        type: 'verification.phoneNumber.created',
        recipientId: event.recipientId,
        recipientType: event.recipientType,
        tenantId: event.tenantId,
        payload: {
          code: event.code,
          recipientId: event.recipientId,
        },
      });
    }
  }
}
