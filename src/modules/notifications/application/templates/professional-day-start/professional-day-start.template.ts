import { Injectable } from '@nestjs/common';
import { NotificationChannel } from 'src/generated/prisma/enums';
import type { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import type { ProfessionalSummaryVariables } from '../../../../appointments/types/professional-summary.type';
import { ProfessionalDayStartEmail } from './email.template';

@Injectable()
export class ProfessionalDayStartTemplate implements NotificationTemplate {
  readonly type = 'professional.day-start';

  build(channel: NotificationChannel, v: ProfessionalSummaryVariables) {
    const count = `${v.count} ${v.count === 1 ? 'cita' : 'citas'}`;
    const title = `Tu agenda de hoy: ${count}`;
    if (channel === NotificationChannel.EMAIL) return { subject: title, react: ProfessionalDayStartEmail(v) };
    if (channel === NotificationChannel.IN_APP)
      return {
        title,
        message: `Hoy tenés ${count} ${v.count === 1 ? 'programada' : 'programadas'}. La primera es a las ${v.firstTime}. ${v.date}. Jornada: ${v.workingHours}.`,
        ...(v.agendaPath
          ? { actionUrl: v.agendaPath, actionLabel: 'Ver mi agenda', action: { version: 1 as const, kind: 'CALENDAR' as const } }
          : {}),
      };
    throw new Error(`Unsupported channel for ${this.type}: ${channel}`);
  }
}
