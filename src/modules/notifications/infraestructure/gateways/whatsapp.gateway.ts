import { Injectable } from '@nestjs/common';
import { Notification } from 'src/generated/prisma/client';
import { BuildWhatsappResponse } from '../../domain/templates/build-whatsapp.interface';

@Injectable()
export class WhatsappGateway {
  async send(notification: Notification, template: BuildWhatsappResponse) {
    console.log({ notification, template });
    return 'whatsapp-reference-id';
  }
}
