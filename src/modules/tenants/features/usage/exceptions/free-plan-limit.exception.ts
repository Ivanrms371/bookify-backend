import { ConflictException } from '@nestjs/common';

export class FreePlanLimitException extends ConflictException {
  constructor(resource: 'professionals' | 'services', used: number, limit: number) {
    super({
      code: 'PLAN_LIMIT_REACHED',
      resource,
      used,
      limit,
      message: `Free permite ${limit} ${resource === 'professionals' ? 'profesional' : 'servicios'}. Elimina recursos o elige un plan de pago para continuar.`,
    });
  }
}
