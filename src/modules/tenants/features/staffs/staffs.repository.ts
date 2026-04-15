import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { StaffCreateInput, StaffUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { StaffQueryParamsDto } from './dto/staff-query.params.dto';
import { StaffFindAllByTenantParams, StaffFindAllParams } from './types/staff-find-all.params';

@Injectable()
export class StaffsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAllByTenant(params: StaffFindAllByTenantParams, client?: TransactionClient) {
    const { tenantId, query, take = 10, skip = 0, orderBy = 'name', order = 'asc' } = params;
    return this.db(client).staff.findMany({
      where: {
        tenantId: tenantId,
        deletedAt: null,
        ...(query ? { displayName: { contains: query, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        displayName: true,
        title: true,
        avatarUrl: true,
        colorTheme: true,
        commissionPercent: true,
        bio: true,
        isActive: true,
        user: {
          select: {
            email: true,
            phone: true,
            memberships: {
              where: { tenantId: tenantId },
              select: { status: true, role: true,  }
            }
          },
        },
      },
      orderBy: { [orderBy]: order },
      take,
      skip,
    });
  }

  findAll(params: StaffFindAllParams, client?: TransactionClient) {
    const { query, take = 10, skip = 0, orderBy = 'name', order = 'asc' } = params;

    return this.db(client).staff.findMany({
      where: {
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { displayName: { contains: query, mode: 'insensitive' } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        displayName: true,
        title: true,
        avatarUrl: true,
        colorTheme: true,
        bio: true,
        isActive: true,
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { [orderBy]: order },
      take,
      skip,
    });
  }

  findById(id: string, client?: TransactionClient) {
    return this.db(client).staff.findUnique({
      where: { id },
    });
  }

  findByIdOnlyTenantId(id: string, client?: TransactionClient) {
    return this.db(client).staff.findUnique({
      where: { id },
      select: { tenantId: true },
    });
  }

  findByUserIdAndTenantId(userId: string, tenantId: string, client?: TransactionClient) {
    return this.db(client).staff.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
  }

  create(data: StaffCreateInput, client?: TransactionClient) {
    return this.db(client).staff.create({ data });
  }

  update(id: string, data: StaffUpdateInput, client?: TransactionClient) {
    return this.db(client).staff.update({
      where: { id },
      data,
    });
  }
}
