import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import type { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import type { ProfessionalEveningSummaryVariables } from '../../../../appointments/types/professional-summary.type';
import { ProfessionalDayEndEmail } from './email.template';

export function eveningSummaryMessage(v: ProfessionalEveningSummaryVariables): string {
  const completed = `${v.completedCount} ${v.completedCount === 1 ? 'cita' : 'citas'}`;
  return (
    `Completaste ${completed}. Valor de servicios completados: ${v.completedValue} ${v.currency}. Canceladas: ${v.cancelledCount}. Ausencias: ${v.noShowCount}.` +
    (v.unresolvedCount ? ` ${v.unresolvedCount} ${v.unresolvedCount === 1 ? 'cita pendiente' : 'citas pendientes'} de registrar.` : '') +
    ` Datos al ${v.snapshotTime}.`
  );
}

@Injectable()
export class ProfessionalDayEndTemplate implements NotificationTemplate {
  readonly type = 'professional.day-end';

  build(channel: NotificationChannel, v: ProfessionalEveningSummaryVariables) {
    const title = `Tu resumen del ${v.date}`;
    if (channel === NotificationChannel.EMAIL) return { subject: title, react: ProfessionalDayEndEmail(v) };
    if (channel === NotificationChannel.IN_APP)
      return {
        title,
        message: eveningSummaryMessage(v),
        ...(v.agendaPath
          ? {
              actionUrl: v.agendaPath,
              actionLabel: 'Ver resumen del día',
              action: { version: 1 as const, kind: 'CALENDAR' as const, date: v.businessDate, professionalId: v.professionalId },
            }
          : {}),
      };
    throw new Error(`Unsupported channel for ${this.type}: ${channel}`);
  }
}
