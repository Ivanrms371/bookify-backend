import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { PrismaClient } from 'src/generated/prisma/client';
import { ServiceAssignmentUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class ServiceAssignmentsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByEmployee(employeeId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.findMany({
      where: { employeeId },
      include: { service: true },
      orderBy: { service: { displayOrder: 'asc' } },
    });
  }

  findPublicByEmployee(employeeId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.findMany({
      where: { employeeId, isActive: true, service: { isActive: true, deletedAt: null } },
      include: { service: true },
      orderBy: { service: { displayOrder: 'asc' } },
    });
  }

  assignTo(serviceId: string, employeeId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.create({
      data: { serviceId, employeeId },
    });
  }

  unassignFrom(serviceId: string, employeeId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.delete({
      where: { employeeId_serviceId: { serviceId, employeeId } },
    });
  }

  activate(serviceId: string, employeeId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.update({
      where: { employeeId_serviceId: { serviceId, employeeId } },
      data: { isActive: true },
    });
  }

  deactivate(serviceId: string, employeeId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.update({
      where: { employeeId_serviceId: { serviceId, employeeId } },
      data: { isActive: false },
    });
  }

  update(serviceId: string, employeeId: string, data: ServiceAssignmentUpdateInput, client?: PrismaClient) {
    return this.db(client).serviceAssignment.update({
      where: { employeeId_serviceId: { serviceId, employeeId } },
      data,
    });
  }

  deleteByEmployeeId(employeeId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.deleteMany({
      where: { employeeId },
    });
  }

  createMany(data: Array<{ employeeId: string; serviceId: string; isActive: boolean }>, client?: PrismaClient) {
    return this.db(client).serviceAssignment.createMany({
      data,
    });
  }
}
