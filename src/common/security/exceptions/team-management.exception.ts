import { ForbiddenException } from '@nestjs/common';
export class TeamManagementForbiddenException extends ForbiddenException {
  constructor() {
    super('No tenés permiso para administrar el equipo.');
  }
}
export class TeamRoleForbiddenException extends ForbiddenException {
  constructor() {
    super('No tenés permiso para administrar este rol.');
  }
}
