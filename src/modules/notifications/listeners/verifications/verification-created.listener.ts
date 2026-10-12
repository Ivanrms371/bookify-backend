import type { VerificationCreatedEvent } from 'src/modules/verifications/types/verification-created-event';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { NotificationsService } from '../../application/services/notifications.service';
import { RecipientType } from 'src/generated/prisma/enums';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class VerificationCreatedListener {
  private readonly frontendUrl: string;
  private readonly logger = new Logger(VerificationCreatedListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  // Keep the returned promise visible to emitAsync; async scheduling would detach Nest's wrapper.
  @OnEvent('verification.created', { suppressErrors: false })
  async handle(event: VerificationCreatedEvent) {
    if (event.recipientType === RecipientType.CUSTOMER) {
      if (!event.tenantId || !event.channel || !event.code || !event.tx) throw new Error('Missing customer verification context');
      await this.notificationsService.createOccurrence(
        {
          type: 'customer.verification',
          tenantId: event.tenantId,
          referenceId: event.verificationId,
          recipientId: event.recipientId,
          recipientType: RecipientType.CUSTOMER,
          occurrenceKey: `customer-verification:${event.verificationId}`,
          expiresAt: event.expiresAt,
          payload: { code: event.code, phone: event.phone ?? null, email: event.email ?? null },
        },
        event.tx,
        event.channel,
      );
      return;
    }
    // User requests still publish without awaiting listeners. Preserve their
    // existing log-and-suppress behavior while customer outbox errors propagate.
    try {
      await this.handleUser(event);
    } catch (error) {
      this.logger.error('User verification notification failed', error instanceof Error ? error.stack : String(error));
    }
  }

  private async handleUser(event: VerificationCreatedEvent) {
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
        referenceId: event.verificationId,
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
        referenceId: event.verificationId,
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
