import { BadRequestException, ForbiddenException } from '@nestjs/common';

export class AppointmentStatusPermissionException extends ForbiddenException {
  constructor() {
    super('No tienes permisos para actualizar citas.');
  }
}

export class AppointmentStatusTransitionException extends BadRequestException {
  constructor() {
    super('Esta cita no puede cambiar a ese estado.');
  }
}

export class AppointmentNotStartedException extends BadRequestException {
  constructor() {
    super('No puedes completar o marcar ausente una cita que todavía no comenzó.');
  }
}
