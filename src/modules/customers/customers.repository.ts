import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { CustomerUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { FindAllCustomersParams } from './types/customer-find-all.params';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByPhone(tenantId: string, phoneCountryCode: string, phone: string) {
    return this.db().customer.findUnique({
      where: { tenantId_phoneCountryCode_phone: { tenantId, phoneCountryCode, phone } },
    });
  }

  async findByEmail(tenantId: string, email: string) {
    return this.db().customer.findFirst({ where: { tenantId, email, deletedAt: null } });
  }

  async findById(tenantId: string, id: string) {
    return this.db().customer.findUnique({ where: { id, tenantId, deletedAt: null } });
  }

  async upsert(tenantId: string, data: CreateCustomerDto) {
    return this.prisma.customer.upsert({
      where: { tenantId_phoneCountryCode_phone: { tenantId, phoneCountryCode: data.phoneCountryCode, phone: data.phone } },
      update: {
        ...data,
        deletedAt: null,
      },
      create: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  async update(tenantId: string, id: string, data: CustomerUpdateInput) {
    return this.db().customer.update({
      where: { id, tenantId, deletedAt: null },
      data,
    });
  }

  async softDelete(tenantId: string, id: string) {
    return this.db().customer.update({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async block(tenantId: string, id: string) {
    return this.db().customer.update({
      where: { id, tenantId, deletedAt: null },
      data: { blockedAt: new Date() },
    });
  }

  async unblock(tenantId: string, id: string) {
    return this.db().customer.update({
      where: { id, tenantId, deletedAt: null },
      data: { blockedAt: null },
    });
  }

  async findMany(params: FindAllCustomersParams) {
    const { tenantId, take = 10, skip = 0, orderBy = 'name', order = 'asc' } = params;

    const [customers, total] = await Promise.all([
      this.db().customer.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { [orderBy]: order },
        select: {
          id: true,
          name: true,
          phone: true,
          phoneCountryCode: true,
          email: true,
          preferredLanguage: true,
          notes: true,
          blockedAt: true,
          firstAppointmentAt: true,
          lastAppointmentAt: true,
        },
        take: Number(take),
        skip: Number(skip),
      }),
      this.db().customer.count({
        where: { tenantId, deletedAt: null },
      }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  async search(tenantId: string, query: string) {
    const search = `%${query}%`;

    return this.db().$queryRaw<any[]>`
    SELECT id, name, phone, email, phoneCountryCode, preferredLanguage, notes, blockedAt, firstAppointmentAt, lastAppointmentAt, totalSpent,
      similarity(unaccent(${query}), unaccent(name)) AS score
    FROM customers
    WHERE "tenant_id" = ${tenantId}::uuid
    AND "deleted_at" IS NULL
    AND (
      similarity(unaccent(${query}), unaccent(name)) > 0.1
      OR email ILIKE ${search}
      OR phone ILIKE ${search}
    )
    ORDER BY score DESC
    LIMIT 10;
  `;
  }
}
