import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import type { CheckoutBlocker } from '../dto/checkout.dto';

export class IneligiblePlanChangeException extends BadRequestException {
  constructor(blockers: CheckoutBlocker[]) {
    super({
      code: blockers[0]?.code ?? 'PLAN_CHANGE_UNAVAILABLE',
      message: blockers.map((blocker) => blocker.message).join(' '),
      blockers,
    });
  }
}
export class PlanChangeConflictException extends ConflictException {
  constructor() {
    super({ code: 'PLAN_CHANGE_CONFLICT', message: 'La suscripción está cambiando. Actualiza el estado antes de solicitar otro cambio.' });
  }
}
export class UnsupportedPlanPaymentException extends BadRequestException {
  constructor() {
    super({ code: 'PLAN_CHANGE_PAYMENT_UNSUPPORTED', message: 'Este método de pago no permite cambiar el plan desde Bookify.' });
  }
}
export class PlanChangeUnconfirmedException extends ServiceUnavailableException {
  constructor() {
    super({ code: 'PLAN_CHANGE_UNCONFIRMED', message: 'No pudimos confirmar el resultado. Actualiza el estado; no vuelvas a pagar.' });
  }
}
