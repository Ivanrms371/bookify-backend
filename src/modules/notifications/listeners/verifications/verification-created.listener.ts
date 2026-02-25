import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../../application/services/notifications.service';
import { VerificationCreatedEvent } from 'src/modules/verifications/domain/events/verification-created.event';

@Injectable()
export class VerificationCreatedListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('verification.created', { async: true })
  async handle({ name, confirmLink, email }: VerificationCreatedEvent) {
    await this.notificationsService.sendDirectlyEmail({
      to: email,
      type: 'verification.email.created',
      payload: { name, confirmLink },
    });
  }
}
