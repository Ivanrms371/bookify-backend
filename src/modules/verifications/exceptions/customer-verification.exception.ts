import { BadRequestException } from '@nestjs/common';
export class CustomerVerificationException extends BadRequestException {
  constructor(message = 'Verificación inválida o cliente no disponible.') {
    super(message);
  }
}
