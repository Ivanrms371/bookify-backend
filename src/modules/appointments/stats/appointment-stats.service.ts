import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AppointmentStatsRepository } from './appointment-stats.repository';
import type { AppointmentMutationContext, PendingAppointmentEvent } from './types/appointment-stats.types';

@Injectable()
export class AppointmentStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: AppointmentStatsRepository,
    private readonly events: EventEmitter2,
  ) {}

  async mutate<T>(tenantId: string, operation: (context: AppointmentMutationContext) => Promise<T>): Promise<T> {
    const events: PendingAppointmentEvent[] = [];
    const result = await this.prisma.$transaction(
      async (tx) => {
        // All dashboard/public appointment writers acquire the same tenant lock before reads.
        // This serializes summary replacement and availability-check/write pairs.
        const tenants = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM tenants WHERE id = ${tenantId}::uuid FOR UPDATE`;
        if (!tenants.length) throw new NotFoundException('No hemos encontrado el negocio.');
        const result = await operation({ tx, afterCommit: (name, payload) => events.push({ name, payload }) });
        await this.repository.rebuild(tenantId, tx);
        return result;
      },
      { timeout: 15000 },
    );
    for (const event of events) this.events.emit(event.name, event.payload);
    return result;
  }
}
