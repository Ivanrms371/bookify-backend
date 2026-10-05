import { ConflictException, ForbiddenException } from '@nestjs/common';
export class StaleProfessionalAccessException extends ConflictException {
  constructor() {
    super('El acceso cambió. Volvé a abrir el formulario.');
  }
}
export class ProfessionalAccessForbiddenException extends ForbiddenException {
  constructor() {
    super('No podés modificar este acceso.');
  }
}
export class ProfessionalEditorForbiddenException extends ForbiddenException {
  constructor() {
    super('No podés editar profesionales en este espacio.');
  }
}
export class ProfessionalMembershipMissingException extends ConflictException {
  constructor() {
    super('La membresía vinculada no existe.');
  }
}
