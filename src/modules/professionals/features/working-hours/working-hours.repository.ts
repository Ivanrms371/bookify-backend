import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import {
  ProfessionalWorkingHoursCreateInput,
  ProfessionalWorkingHoursCreateManyArgs,
  ProfessionalWorkingHoursUpdateInput,
} from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class ProfessionalWorkingHoursRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByProfessional(tenantId: string, professionalId: string) {
    return this.prisma.professionalWorkingHours.findMany({
      where: {
        tenantId,
        professionalId,
      },
    });
  }

  createMany(data: ProfessionalWorkingHoursCreateManyArgs, tx?: TransactionClient) {
    const client = tx || this.prisma;
    return client.professionalWorkingHours.createMany(data);
  }

  deleteMany(tenantId: string, professionalId: string, tx?: TransactionClient) {
    const client = tx || this.prisma;
    return client.professionalWorkingHours.deleteMany({ where: { tenantId, professionalId } });
  }
}
