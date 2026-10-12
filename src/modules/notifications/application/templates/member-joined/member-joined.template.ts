import { Injectable } from '@nestjs/common';
import type { NotificationChannel } from 'src/generated/prisma/enums';
import type { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import type { MemberJoinedVariables } from '../../../types/member-joined.type';

@Injectable()
export class MemberJoinedTemplate implements NotificationTemplate {
  readonly type = 'member.joined';
  build(channel: NotificationChannel, v: MemberJoinedVariables) {
    if (channel !== 'IN_APP') throw new Error(`Unsupported channel for ${this.type}: ${channel}`);
    const roles = { OWNER: 'dueño', ADMIN: 'administrador', STAFF: 'personal' };
    return {
      title: `${v.memberName} se unió al equipo`,
      message: `Ya tiene acceso a ${v.businessName} como ${roles[v.role]}.`,
      actionUrl: v.teamPath,
      actionLabel: 'Ver equipo',
      action: { version: 1 as const, kind: 'TEAM' as const },
    };
  }
}
