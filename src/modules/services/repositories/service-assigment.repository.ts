import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { PrismaClient } from 'src/generated/prisma/client';
import { ServiceAssignmentUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceAssigmentRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByStaff(staffId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.findMany({
      where: { staffId },
      include: { service: true },
      orderBy: { service: { displayOrder: 'asc' } },
    });
  }

  findPublicByStaff(staffId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.findMany({
      where: { staffId, isActive: true, service: { isActive: true, deletedAt: null } },
      include: { service: true },
      orderBy: { service: { displayOrder: 'asc' } },
    });
  }

  assignTo(serviceId: string, proffesionalId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.create({
      data: { serviceId, staffId: proffesionalId },
    });
  }

  unassignFrom(serviceId: string, proffesionalId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.delete({
      where: { staffId_serviceId: { serviceId, staffId: proffesionalId } },
    });
  }

  activate(serviceId: string, staffId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.update({
      where: { staffId_serviceId: { serviceId, staffId } },
      data: { isActive: true },
    });
  }

  deactivate(serviceId: string, staffId: string, client?: PrismaClient) {
    return this.db(client).serviceAssignment.update({
      where: { staffId_serviceId: { serviceId, staffId } },
      data: { isActive: false },
    });
  }

  update(
    serviceId: string,
    proffesionalId: string,
    data: ServiceAssignmentUpdateInput,
    client?: PrismaClient,
  ) {
    return this.db(client).serviceAssignment.update({
      where: { staffId_serviceId: { serviceId, staffId: proffesionalId } },
      data,
    });
  }
}
