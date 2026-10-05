import { BadRequestException } from '@nestjs/common';

export class InvalidProfessionalServicesException extends BadRequestException {
  constructor() {
    const message = 'Seleccioná servicios activos de este espacio, sin repetirlos.';
    super({ message, fields: { serviceIds: message } });
  }
}
