import { ConflictException } from '@nestjs/common';

export class CustomerEmailConflictException extends ConflictException {
  constructor() {
    super('El email no coincide con el contacto del cliente.');
  }
}
