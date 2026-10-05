import { BadRequestException } from '@nestjs/common';

export class InvalidProfessionalRoleException extends BadRequestException {
  constructor() {
    super({ message: 'El acceso de profesionales requiere STAFF.', fields: { role: 'Solo se permite STAFF.' } });
  }
}
