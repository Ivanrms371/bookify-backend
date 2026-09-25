import { Injectable } from '@nestjs/common';
import { BaseRepository, DbClient } from 'src/common/database/base.repository';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ServiceCreateInput, ServiceUpdateInput, ServiceWhereInput } from 'src/generated/prisma/models';
import { PrismaClient } from 'src/generated/prisma/client';
import { ServiceCreateManyArgs } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { GetServicesQueryDto } from './dto/get-services-query.dto';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string, dto: GetServicesQueryDto) {
    const { professionalId, isActive, skip, take, orderBy, order, count } = dto;

    const whereClause: ServiceWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (professionalId) {
      whereClause.assignments = {
        some: { professionalId },
      };
    }

    const dataPromise = this.prisma.service.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: {
        [orderBy]: order,
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        imagePublicId: true,
        description: true,
        price: true,
        discountPercentage: true,
        discountFixed: true,
        durationMinutes: true,
        isActive: true,
        displayOrder: true,
      },
    });

    const shouldCount = count;
    const countPromise = shouldCount ? this.prisma.service.count({ where: whereClause }) : Promise.resolve(null);

    const [data, total] = await Promise.all([dataPromise, countPromise]);

    return {
      data,
      meta: {
        ...(total !== null ? { total } : {}),
        skip,
        take,
      },
    };
  }

  findById(tenantId: string, id: string) {
    return this.prisma.service.findUnique({ where: { id, tenantId, deletedAt: null } });
  }

  create(data: ServiceCreateInput) {
    return this.prisma.service.create({ data: { ...data } });
  }

  createMany(data: ServiceCreateManyArgs) {
    return this.prisma.service.createMany(data);
  }

  deleteMany(tenantId: string) {
    return this.prisma.service.deleteMany({ where: { tenantId } });
  }

  update(tenantId: string, id: string, data: ServiceUpdateInput) {
    return this.prisma.service.update({ where: { id, tenantId }, data });
  }

  updateStatus(tenantId: string, id: string, isActive: boolean) {
    return this.prisma.service.update({ where: { id, tenantId }, data: { isActive } });
  }

  softDelete(tenantId: string, id: string) {
    return this.prisma.service.update({ where: { id, tenantId }, data: { deletedAt: new Date() } });
  }

  findByIdAndProfessional(tenantId: string, id: string, professionalId: string) {
    return this.prisma.service.findFirst({ where: { id, tenantId, assignments: { some: { professionalId } } } });
  }

  findAllProfessionals(tenantId: string, id: string) {
    return this.prisma.professional.findMany({
      where: { tenantId, deletedAt: null, assignments: { some: { serviceId: id } } },
      select: {
        id: true,
        avatarUrl: true,
        name: true,
        colorTheme: true,
        bio: true,
      },
    });
  }

  findAllPublic(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        description: true,
        durationMinutes: true,
        price: true,
        discountPercentage: true,
        discountFixed: true,
      },
    });
  }

  findAllPublicByProfessional(professionalId: string) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        assignments: { some: { professionalId, isActive: true } },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        description: true,
        durationMinutes: true,
        price: true,
        discountPercentage: true,
        discountFixed: true,
      },
    });
  }
}
