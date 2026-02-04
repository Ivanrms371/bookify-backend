import { Injectable, Logger } from '@nestjs/common';
import { NotificationContent, NotificationPayload } from '../types/notification.type';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly cost = 0.0113;
  constructor() {}

  async send(payload: NotificationPayload) {
    return {
      provider: 'whatsapp',
      providerMessageId: '123',
      cost: this.cost,
    };
  }
}
