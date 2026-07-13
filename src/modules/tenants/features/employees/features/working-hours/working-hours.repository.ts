import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { EmployeeWorkingHoursCreateInput, EmployeeWorkingHoursUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class WorkingHoursRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByEmployee(employeeId: string) {
    return this.db().employeeWorkingHours.findMany({
      where: {
        employeeId,
      },
    });
  }

  findById(workingHourId: string, tx?: TransactionClient) {
    return this.db(tx).employeeWorkingHours.findUnique({
      where: { id: workingHourId },
    });
  }

  findByEmployeeAndDay(employeeId: string, dayOfWeek: number, tx?: TransactionClient) {
    return this.db(tx).employeeWorkingHours.findMany({
      where: {
        employeeId,
        dayOfWeek,
      },
    });
  }

  findEmployeeWorkingHoursForSlots(employeeId: string, dayOfWeek: number) {
    return this.db().employeeWorkingHours.findMany({
      where: {
        employeeId,
        dayOfWeek,
      },
      select: {
        opensAt: true,
        closesAt: true,
      },
    });
  }

  create(data: EmployeeWorkingHoursCreateInput, tx?: TransactionClient) {
    return this.db(tx).employeeWorkingHours.create({
      data,
    });
  }

  update(id: string, data: EmployeeWorkingHoursUpdateInput, tx?: TransactionClient) {
    return this.db(tx).employeeWorkingHours.update({
      where: { id },
      data,
    });
  }

  delete(id: string, tx?: TransactionClient) {
    return this.db(tx).employeeWorkingHours.delete({
      where: { id },
    });
  }

  deleteByEmployeeId(employeeId: string, tenantId: string, tx?: TransactionClient) {
    return this.db(tx).employeeWorkingHours.deleteMany({
      where: { employeeId, tenantId },
    });
  }

  createMany(data: Array<EmployeeWorkingHoursCreateInput & { tenantId?: string; employeeId?: string }>, tx?: TransactionClient) {
    return this.db(tx).employeeWorkingHours.createMany({
      data: data as any,
    });
  }
}
