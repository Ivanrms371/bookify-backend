import { BadGatewayException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

export class InvalidPaymentPaginationException extends BadRequestException {
  constructor() {
    super({ code: 'INVALID_PAGINATION', message: 'Payment page is too large.' });
  }
}

export class PaymentNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'PAYMENT_NOT_FOUND', message: 'Payment not found.' });
  }
}

export class InvoiceUnavailableException extends NotFoundException {
  constructor() {
    super({ code: 'INVOICE_UNAVAILABLE', message: 'Invoice is unavailable.' });
  }
}

export class InvalidInvoiceProviderResponseException extends BadGatewayException {
  constructor() {
    super({ code: 'INVOICE_PROVIDER_INVALID', message: 'Invalid invoice response.' });
  }
}

export class InvoiceAssociationConflictException extends ConflictException {
  constructor() {
    super('Invoice belongs to another subscription.');
  }
}

export class InvalidProviderInvoiceUrlException extends BadRequestException {
  constructor() {
    super('Invalid provider invoice URL.');
  }
}
