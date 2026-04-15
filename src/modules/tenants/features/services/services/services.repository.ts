import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ServiceCreateInput, ServiceUpdateInput } from 'src/generated/prisma/models';
import { PrismaClient } from 'src/generated/prisma/client';
import { ReorderServiceDto } from './dto/reoder-service.dto';

@Injectable()
export class ServicesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByTenant(tenantId: string, client?: PrismaClient) {
    return this.db(client).service.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: { assignments: { select: { staffId: true } } },
    });
  }

  findManyByIds(ids: string[], client?: PrismaClient) {
    return this.db(client).service.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }
w
  findPublicByTenant(tenantId: string, client?: PrismaClient) {
    return this.db(client).service.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: { assignments: { select: { staffId: true } } },
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

  findByIdAndStaff(id: string, staffId: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({ 
      where: { id, deletedAt: null, assignments: { some: { staffId}} },
      include: { assignments: true }
    });
  }

  create(data: ServiceCreateInput, client?: PrismaClient) {
    return this.db(client).service.create({ data });
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
