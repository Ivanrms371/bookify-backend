import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { AppointmentCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class AppointmentsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getAppointmentsByStaffAndDate(staffId: string, startOfDay: Date, endOfDay: Date) {
    return await this.db().appointment.findMany({
      where: {
        staffId: staffId,
        status: { not: 'CANCELLED' },
        OR: [
          { startTime: { gte: startOfDay, lt: endOfDay } },
          { endTime: { gt: startOfDay, lte: endOfDay } },
          { AND: [{ startTime: { lte: startOfDay } }, { endTime: { gte: endOfDay } }] },
        ],
      },
      orderBy: { startTime: 'asc' },
    });
  }

  create(appointment: AppointmentCreateInput, tx?: TransactionClient) {
    return this.db(tx).appointment.create({ data: appointment });
  }
}
