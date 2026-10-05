import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
export class EmptyMemberUpdateException extends BadRequestException {
  constructor() {
    super('Se requiere rol o estado de acceso.');
  }
}
export class TeamMemberNotFoundException extends NotFoundException {
  constructor() {
    super('Miembro no encontrado.');
  }
}
export class SelfMembershipChangeException extends ForbiddenException {
  constructor() {
    super('No podés cambiar tu propia membresía.');
  }
}
