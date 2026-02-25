import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { VerificationsService } from '../core/verifications.service';
import { VerificationType } from 'src/generated/prisma/enums';
import { UserCreatedEvent } from 'src/auth/domain/events/user-created.event';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserCreatedListener {
  private readonly backendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly verificationService: VerificationsService,
  ) {
    this.backendUrl = this.configService.get('BACKEND_URL', 'http://localhost:4000/api');
  }

  @OnEvent('user.created', { async: true })
  async handle(payload: UserCreatedEvent) {
    console.log('🔥 user.created recibido');
    const token = await this.verificationService.createTokenVerification({
      userId: payload.userId,
      address: payload.email,
      type: VerificationType.EMAIL_CONFIRM,
    });

    this.eventEmitter.emit('verification.created', {
      email: payload.email,
      name: payload.name,
      confirmLink: `${this.backendUrl}/auth/email/confirm?token=${token}`,
    });
  }
}
