import { Injectable } from '@nestjs/common';
import { BuildWhatsappResponse } from '../../domain/templates/build-whatsapp.interface';
import { SimulatedDeliveryError } from '../../errors/simulated-delivery.error';

@Injectable()
export class WhatsappGateway {
  static isOperational() { return false; }
  async send(phoneNumber: string, template: BuildWhatsappResponse): Promise<string> {
    console.log('WhatsApp simulation', { to: phoneNumber, payload: template });
    throw new SimulatedDeliveryError();
  }
}
