import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { CustomerCreateInput, CustomerUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { FindAllCustomersParams } from './types/customer-find-all.params';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class CustomersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByPhone(tenantId: string, phoneCountryCode: string, phoneNumber: string, tx?: TransactionClient) {
    return this.db(tx).customer.findUnique({
      where: { tenantId_phoneCountryCode_phoneNumber: { tenantId, phoneCountryCode, phoneNumber } },
    });
  }

  async findByEmail(tenantId: string, email: string, tx?: TransactionClient) {
    return this.db(tx).customer.findFirst({ where: { tenantId, email, deletedAt: null } });
  }

  async findById(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).customer.findUnique({ where: { id, tenantId, deletedAt: null } });
  }

  async findByIdGlobal(id: string, tx?: TransactionClient) {
    return this.db(tx).customer.findUnique({ where: { id, deletedAt: null } });
  }

  async create(data: CustomerCreateInput, tx?: TransactionClient) {
    return this.db(tx).customer.create({
      data,
    });
  }

  async update(tenantId: string, id: string, data: CustomerUpdateInput, tx?: TransactionClient) {
    return this.db(tx).customer.update({
      where: { id, tenantId, deletedAt: null },
      data,
    });
  }

  async softDelete(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).customer.update({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async block(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).customer.update({
      where: { id, tenantId, deletedAt: null },
      data: { blockedAt: new Date() },
    });
  }

  async unblock(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).customer.update({
      where: { id, tenantId, deletedAt: null },
      data: { blockedAt: null },
    });
  }

  async findMany(params: FindAllCustomersParams, tx?: TransactionClient) {
    const { tenantId, take = 10, skip = 0, orderBy = 'name', order = 'asc' } = params;

    const [customers, total] = await Promise.all([
      this.db(tx).customer.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { [orderBy]: order },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          phoneCountryCode: true,
          email: true,
          notes: true,
          blockedAt: true,
          firstAppointmentAt: true,
          lastAppointmentAt: true,
        },
        take: Number(take),
        skip: Number(skip),
      }),
      this.db(tx).customer.count({
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

  async search(tenantId: string, query: string, tx?: TransactionClient) {
    const search = `%${query}%`;

    return this.db(tx).$queryRaw<any[]>`
      SELECT
        "id",
        "name",
        "phone_number" AS "phoneNumber",
        "email",
        "phone_country_code" AS "phoneCountryCode",
        "notes",
        "blocked_at" AS "blockedAt",
        "first_appointment_at" AS "firstAppointmentAt",
        "last_appointment_at" AS "lastAppointmentAt",
        "total_spent" AS "totalSpent",
        similarity(unaccent(${query}), unaccent("name")) AS "score"
      FROM "customers"
      WHERE "tenant_id" = ${tenantId}::uuid
        AND "deleted_at" IS NULL
        AND (
          similarity(unaccent(${query}), unaccent("name")) > 0.1
          OR "email" ILIKE ${search}
          OR "phone_number" ILIKE ${search}
        )
      ORDER BY "score" DESC
      LIMIT 10;
    `;
  }

  async markPhoneAsVerified(id: string, tx?: TransactionClient) {
    return this.db(tx).customer.update({ where: { id }, data: { phoneVerifiedAt: new Date() } });
  }

  async markEmailAsVerified(id: string, tx?: TransactionClient) {
    return this.db(tx).customer.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
  }
}
