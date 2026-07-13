import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { EmployeeCreateInput, EmployeeUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { EmployeeQueryParamsDto } from './dto/employee-query.params.dto';
import { EmployeeFindAllByTenantParams, EmployeeFindAllParams } from './types/find-all-employees.params';
import { FindEmployeeByIdInput } from './types/find-employee.params';

@Injectable()
export class EmployeesRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findAllByTenant(params: EmployeeFindAllByTenantParams, client?: TransactionClient) {
    const { tenantId, query, take = 10, skip = 0, orderBy = 'name', order = 'asc' } = params;
    return this.db(client).employee.findMany({
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
              select: { status: true, role: true },
            },
          },
        },
      },
      orderBy: { [orderBy]: order },
      take,
      skip,
    });
  }

  findAll(params: EmployeeFindAllParams, client?: TransactionClient) {
    const { query, take = 10, skip = 0, orderBy = 'name', order = 'asc' } = params;

    return this.db(client).employee.findMany({
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
    return this.db(client).employee.findUnique({
      where: { id },
    });
  }

  findByUserId(userId: string, tenantId: string, client?: TransactionClient) {
    return this.db(client).employee.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
  }

  findByIdOnlyTenantId(id: string, client?: TransactionClient) {
    return this.db(client).employee.findUnique({
      where: { id },
      select: { tenantId: true },
    });
  }

  findByUserAndTenant(userId: string, tenantId: string, client?: TransactionClient) {
    return this.db(client).employee.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
  }

  create(data: EmployeeCreateInput, client?: TransactionClient) {
    return this.db(client).employee.create({ data });
  }

  update(id: string, data: EmployeeUpdateInput, client?: TransactionClient) {
    return this.db(client).employee.update({
      where: { id },
      data,
    });
  }
}
