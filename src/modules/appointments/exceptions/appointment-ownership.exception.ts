import { ForbiddenException } from '@nestjs/common';

export class AppointmentOwnershipException extends ForbiddenException {
  constructor() {
    super('Solo puedes acceder y gestionar citas de tu propio perfil profesional.');
  }
}
