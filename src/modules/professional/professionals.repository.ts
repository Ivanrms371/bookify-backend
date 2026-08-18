import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { GetServicesQueryDto } from '../services/dto/get-services-query.dto';
import { GetProfessionalsQueryDto } from './dto/get-professionals-query.dto';
import {
  ProfessionalCreateInput,
  ProfessionalSelect,
  ProfessionalUpdateInput,
  ProfessionalWhereInput,
  ServiceAssignmentCreateInput,
  ServiceAssignmentCreateManyInput,
} from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class ProfessionalsRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findMany(tenantId: string, query: GetProfessionalsQueryDto) {
    const { serviceId, skip, take } = query;

    const where: ProfessionalWhereInput = {
      tenantId,
      deletedAt: null,
    };

    const select: ProfessionalSelect = {
      id: true,
      displayName: true,
      avatarUrl: true,
      colorTheme: true,
      bio: true,
      isActive: true,
      user: {
        select: {
          email: true,
          phone: true,
          phoneCountryCode: true,
        },
      },
    };

    if (serviceId) {
      where.assignments = {
        some: {
          serviceId,
          isActive: true,
        },
      };
    }

    return this.prisma.professional.findMany({
      where,
      skip,
      take,
      select,
    });
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.professional.findUnique({ where: { id, tenantId, deletedAt: null } });
  }

  async findByIdWithDetails(tenantId: string, id: string) {
    return this.prisma.professional.findUnique({
      where: { id, tenantId, deletedAt: null },
      include: {
        user: {
          include: {
            memberships: {
              where: { tenantId },
            },
          },
        },
        assignments: true,
        workingHours: true,
      },
    });
  }

  async create(data: ProfessionalCreateInput) {
    return this.prisma.professional.create({ data });
  }

  async update(tenantId: string, id: string, data: ProfessionalUpdateInput, tx?: TransactionClient) {
    const client = tx || this.prisma;
    return client.professional.update({ where: { id, tenantId }, data });
  }

  async softDelete(tenantId: string, id: string) {
    return this.prisma.professional.update({ where: { id, tenantId }, data: { deletedAt: new Date() } });
  }

  async replaceServices(professionalId: string, data: ServiceAssignmentCreateManyInput[], tx?: TransactionClient) {
    const client = tx || this.prisma;
    await client.serviceAssignment.deleteMany({ where: { professionalId } });
    return await client.serviceAssignment.createMany({ data });
  }

  async addService(professionalId: string, servicId: string) {
    return this.prisma.serviceAssignment.create({
      data: {
        professional: {
          connect: {
            id: professionalId,
          },
        },
        service: {
          connect: {
            id: servicId,
          },
        },
      },
    });
  }

  async removeService(professionalId: string, serviceId: string) {
    return this.prisma.serviceAssignment.delete({
      where: {
        professionalId_serviceId: { professionalId, serviceId },
      },
    });
  }
}
