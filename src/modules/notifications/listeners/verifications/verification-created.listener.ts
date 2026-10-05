import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType, VerificationType } from 'src/generated/prisma/enums';
import { UsersService } from 'src/modules/users/users.service';

export interface VerificationCreatedEvent {
  verificationId: string;
  type: VerificationType;
  recipientId: string;
  recipientType: RecipientType;
  token?: string;
  invitationToken?: string;
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
    private readonly usersService: UsersService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  @OnEvent('verification.created', { async: true })
  async handle(event: VerificationCreatedEvent) {
    if (event.token) {
      const params = new URLSearchParams({
        token: event.token,
        type: event.type,
        ...(event.invitationToken ? { invitationToken: event.invitationToken } : {}),
      });
      const confirmLink = `${this.frontendUrl}/auth/verify?${params}`;

      let name = '';
      if (event.recipientType === RecipientType.USER) {
        const user = await this.usersService.findById(event.recipientId);
        name = user?.name ?? '';
      }

      await this.notificationsService.create({
        type: 'verification.email.created',
        recipientId: event.recipientId,
        recipientType: event.recipientType,
        tenantId: event.tenantId,
        payload: {
          name,
          confirmLink,
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
