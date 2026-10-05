import { ForbiddenException } from '@nestjs/common';

export class ProfessionalDeletionForbiddenException extends ForbiddenException {
  constructor() {
    super('No podés eliminar un profesional vinculado a esta cuenta.');
  }
}
