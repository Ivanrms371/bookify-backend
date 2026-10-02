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
import { BaseRepository } from 'src/common/database/base.repository';

@Injectable()
export class ProfessionalsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(tenantId: string, query: GetProfessionalsQueryDto, tx?: TransactionClient) {
    const { serviceId, skip, take } = query;

    const where: ProfessionalWhereInput = {
      tenantId,
      deletedAt: null,
    };

    const select: ProfessionalSelect = {
      id: true,
      name: true,
      avatarUrl: true,
      colorTheme: true,
      bio: true,
      isActive: true,
      user: {
        select: {
          email: true,
          phoneNumber: true,
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

    return this.db(tx).professional.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'asc' },
      select,
    });
  }

  async findByUserId(tenantId: string, userId: string, tx?: TransactionClient) {
    return this.db(tx).professional.findFirst({ where: { userId, tenantId, deletedAt: null } });
  }

  async findById(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).professional.findUnique({ where: { id, tenantId, deletedAt: null } });
  }

  async findByEmail(tenantId: string, email: string, tx?: TransactionClient) {
    return this.db(tx).professional.findFirst({ where: { email, tenantId, deletedAt: null } });
  }

  async findByIdWithDetails(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).professional.findUnique({
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

  async create(data: ProfessionalCreateInput, tx?: TransactionClient) {
    return this.db(tx).professional.create({ data });
  }

  async update(tenantId: string, id: string, data: ProfessionalUpdateInput, tx?: TransactionClient) {
    return this.db(tx).professional.update({ where: { id, tenantId }, data });
  }

  async softDelete(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).professional.update({ where: { id, tenantId }, data: { deletedAt: new Date() } });
  }

  async replaceServices(professionalId: string, data: ServiceAssignmentCreateManyInput[], tx?: TransactionClient) {
    this.db(tx).serviceAssignment.deleteMany({ where: { professionalId } });
    return await this.db(tx).serviceAssignment.createMany({ data });
  }

  async addService(professionalId: string, servicId: string, tx?: TransactionClient) {
    return this.db(tx).serviceAssignment.create({
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

  async removeService(professionalId: string, serviceId: string, tx?: TransactionClient) {
    return this.db(tx).serviceAssignment.delete({
      where: {
        professionalId_serviceId: { professionalId, serviceId },
      },
    });
  }

  async findAllPublic(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).professional.findMany({
      where: { deletedAt: null, isActive: true, tenantId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
      },
    });
  }

  async findAllPublicByService(serviceId: string, tx?: TransactionClient) {
    return this.db(tx).professional.findMany({
      where: { deletedAt: null, isActive: true, assignments: { some: { serviceId } } },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
      },
    });
  }
}
