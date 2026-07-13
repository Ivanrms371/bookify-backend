import { Injectable } from '@nestjs/common';
import { BaseRepository, DbClient } from 'src/common/database/base.repository';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ServiceCreateInput, ServiceUpdateInput } from 'src/generated/prisma/models';
import { PrismaClient } from 'src/generated/prisma/client';
import { ReorderServiceDto } from './dto/reoder-service.dto';
import { ServiceCreateManyArgs } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class ServicesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByTenant(tenantId: string, client?: TransactionClient) {
    return this.db(client).service.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: { assignments: { select: { employeeId: true } } },
    });
  }

  findManyByIds(ids: string[], client?: PrismaClient) {
    return this.db(client).service.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  findPublicByTenant(tenantId: string, client?: PrismaClient) {
    return this.db(client).service.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: { assignments: { select: { employeeId: true } } },
    });
  }

  countByTenant(tenantId: string, client?: PrismaClient) {
    return this.db(client).service.count({
      where: { tenantId, deletedAt: null },
    });
  }

  findById(id: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({ where: { id, deletedAt: null } });
  }

  findByIdOnlyTenantId(id: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({
      where: { id, deletedAt: null },
      select: { tenantId: true },
    });
  }

  findByIdAndTenant(id: string, tenantId: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({ where: { id, tenantId, deletedAt: null } });
  }

  findByIdAndEmployee(id: string, employeeId: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({
      where: { id, deletedAt: null, assignments: { some: { employeeId } } },
      include: { assignments: true },
    });
  }

  create(data: ServiceCreateInput, client?: PrismaClient) {
    return this.db(client).service.create({ data });
  }

  createMany(data: ServiceCreateManyArgs, client?: DbClient) {
    return this.db(client).service.createMany(data);
  }

  deleteMany(tenantId: string, client?: DbClient) {
    return this.db(client).service.deleteMany({ where: { tenantId } });
  }

  update(id: string, data: ServiceUpdateInput, client?: PrismaClient) {
    return this.db(client).service.update({ where: { id }, data });
  }

  updateStatus(id: string, isActive: boolean, client?: PrismaClient) {
    return this.db(client).service.update({ where: { id }, data: { isActive } });
  }

  softDelete(id: string, client?: PrismaClient) {
    return this.db(client).service.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  reorder(tenantId: string, orders: ReorderServiceDto[], client?: PrismaClient) {
    return this.db(client).service.updateMany({
      where: { tenantId },
      data: orders.map((order) => ({
        order: 1, // TODO: implement order logic,
      })),
    });
  }
}
