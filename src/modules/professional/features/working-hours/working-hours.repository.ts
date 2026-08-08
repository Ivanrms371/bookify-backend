import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { ProfessionalWorkingHoursCreateInput, ProfessionalWorkingHoursUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class WorkingHoursRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findMany(professionalId: string) {
    return this.db().professionalWorkingHours.findMany({
      where: {
        professionalId,
      },
    });
  }

  findById(workingHourId: string, tx?: TransactionClient) {
    return this.db(tx).professionalWorkingHours.findUnique({
      where: { id: workingHourId },
    });
  }

  findByProfessionalAndDay(professionalId: string, dayOfWeek: number, tx?: TransactionClient) {
    return this.db(tx).professionalWorkingHours.findMany({
      where: {
        professionalId,
        dayOfWeek,
      },
    });
  }

  findForSlots(professionalId: string, dayOfWeek: number) {
    return this.db().professionalWorkingHours.findMany({
      where: {
        professionalId,
        dayOfWeek,
      },
      select: {
        opensAt: true,
        closesAt: true,
      },
    });
  }

  create(data: ProfessionalWorkingHoursCreateInput, tx?: TransactionClient) {
    return this.db(tx).professionalWorkingHours.create({
      data,
    });
  }

  update(id: string, data: ProfessionalWorkingHoursUpdateInput, tx?: TransactionClient) {
    return this.db(tx).professionalWorkingHours.update({
      where: { id },
      data,
    });
  }

  delete(id: string, tx?: TransactionClient) {
    return this.db(tx).professionalWorkingHours.delete({
      where: { id },
    });
  }

  deleteByProfessionalId(professionalId: string, tenantId: string, tx?: TransactionClient) {
    return this.db(tx).professionalWorkingHours.deleteMany({
      where: { professionalId, tenantId },
    });
  }

  createMany(data: Array<ProfessionalWorkingHoursCreateInput & { tenantId?: string; professionalId?: string }>, tx?: TransactionClient) {
    return this.db(tx).professionalWorkingHours.createMany({
      data: data as any,
    });
  }
}
