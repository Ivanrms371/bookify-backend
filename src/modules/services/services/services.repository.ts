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

  findManyByBusiness(businessId: string, client?: PrismaClient) {
    return this.db(client).service.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  findPublicByBusiness(businessId: string, client?: PrismaClient) {
    return this.db(client).service.findMany({
      where: { businessId, isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  countByBusiness(businessId: string, client?: PrismaClient) {
    return this.db(client).service.count({
      where: { businessId, deletedAt: null },
    });
  }

  findById(id: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({ where: { id, deletedAt: null } });
  }

  findByIdOnlyBusinessId(id: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({
      where: { id, deletedAt: null },
      select: { businessId: true },
    });
  }

  findByIdAndBusiness(id: string, businessId: string, client?: PrismaClient) {
    return this.db(client).service.findUnique({ where: { id, businessId, deletedAt: null } });
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

  reorder(businessId: string, orders: ReorderServiceDto[], client?: PrismaClient) {
    return this.db(client).service.updateMany({
      where: { businessId },
      data: orders.map((order) => ({
        order: 1, // TODO: implement order logic,
      })),
    });
  }
}
