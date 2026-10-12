import { Injectable } from '@nestjs/common';
import type { NotificationChannel } from 'src/generated/prisma/enums';
import type { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import type { BillingNoticeType, BillingNoticeVariables } from '../../../../subscriptions/types/billing-notice.type';
import { BillingNoticeEmail } from './email.template';

export class BillingNoticeTemplate implements NotificationTemplate {
  constructor(readonly type: BillingNoticeType) {}
  build(channel: NotificationChannel, v: BillingNoticeVariables) {
    const renewal = this.type === 'billing.renewal.3d';
    const title = renewal
      ? `Tu suscripción se renueva el ${v.endDate}`
      : this.type === 'billing.trial.ends.7d'
        ? `Tu prueba termina el ${v.endDate}`
        : 'Tu prueba está por terminar';
    const message = renewal
      ? `La renovación de la suscripción de ${v.businessName} está prevista para el ${v.endDate}. Podés revisar los detalles en Facturación.`
      : `Tu período de prueba termina el ${v.endDate} a las ${v.endTime} (${v.timeZone}). Revisá los planes disponibles para ${v.businessName}.`;
    const label = renewal ? 'Ver facturación' : 'Ver planes';
    if (channel === 'EMAIL') return { subject: title, react: BillingNoticeEmail(v, title, message, label) };
    if (channel === 'IN_APP')
      return {
        title,
        message,
        ...(v.actionPath
          ? {
              actionUrl: v.actionPath,
              actionLabel: label,
              action: { version: 1 as const, kind: 'BILLING' as const, destination: renewal ? ('OVERVIEW' as const) : ('PLANS' as const) },
            }
          : {}),
      };
    throw new Error(`Unsupported channel for ${this.type}: ${channel}`);
  }
}

@Injectable()
export class TrialEnds7dTemplate extends BillingNoticeTemplate {
  constructor() {
    super('billing.trial.ends.7d');
  }
}
@Injectable()
export class TrialEnds3dTemplate extends BillingNoticeTemplate {
  constructor() {
    super('billing.trial.ends.3d');
  }
}
@Injectable()
export class Renewal3dTemplate extends BillingNoticeTemplate {
  constructor() {
    super('billing.renewal.3d');
  }
}
