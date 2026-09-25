import { ConflictException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

export class CustomerPhoneAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      code: 'CUSTOMER_PHONE_ALREADY_EXISTS',
      message: 'No hemos podido crear el cliente.',
      fields: { phoneNumber: 'El número de teléfono ya está en uso' },
    });
  }
}

export class CustomerNotFoundException extends NotFoundException {
  constructor() {
    super({
      code: 'CUSTOMER_NOT_FOUND',
      message: 'No hemos podido encontrar el cliente',
    });
  }
}
