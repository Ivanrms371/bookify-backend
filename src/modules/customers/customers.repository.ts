import { Prisma } from 'src/generated/prisma/client';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { CustomerCreateInput, CustomerUpdateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { FindAllCustomersParams } from './types/customer-find-all.params';
import type { CustomerListingRow } from './types/customer-listing-row.type';
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
    const { tenantId, take = 24, skip = 0, orderBy = 'createdAt', order = 'desc', status, bookingActivity } = params;
    const query = params.query?.trim();
    const now = new Date();
    const conditions = [Prisma.sql`c.tenant_id = ${tenantId}::uuid`, Prisma.sql`c.deleted_at IS NULL`];
    if (query) {
      // Keep email/phone substring searches literal; names use accent-insensitive similarity.
      const search = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
      const phoneDigits = query.replace(/\D/g, '');
      const fullPhoneSearch = phoneDigits && /^[+\d\s().-]+$/.test(query)
        ? Prisma.sql`OR regexp_replace(c.phone_country_code || c.phone_number, '[^0-9]', '', 'g') ILIKE ${`%${phoneDigits}%`}`
        : Prisma.empty;
      conditions.push(Prisma.sql`(
        similarity(unaccent(${query}), unaccent(c.name)) > 0.1
        OR c.email ILIKE ${search}
        OR c.phone_number ILIKE ${search}
        OR c.phone_country_code ILIKE ${search}
        ${fullPhoneSearch}
      )`);
    }
    if (status === 'blocked') conditions.push(Prisma.sql`c.blocked_at IS NOT NULL`);
    if (status === 'unblocked') conditions.push(Prisma.sql`c.blocked_at IS NULL`);
    if (bookingActivity === 'upcoming') {
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM appointments a WHERE a.customer_id = c.id AND a.tenant_id = c.tenant_id
        AND a.status IN ('PENDING', 'CONFIRMED') AND a.starts_at >= ${now}
      )`);
    }
    if (bookingActivity === 'never-booked') {
      conditions.push(Prisma.sql`NOT EXISTS (
        SELECT 1 FROM appointments a WHERE a.customer_id = c.id AND a.tenant_id = c.tenant_id
      )`);
    }
    const where = Prisma.join(conditions, ' AND ');
    const sortColumns = {
      name: Prisma.sql`c.name`,
      createdAt: Prisma.sql`c.created_at`,
      totalSpent: Prisma.sql`c.total_spent`,
      lastVisitAt: Prisma.sql`visits.last_visit_at`,
    };
    const direction = order === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const sorting = Prisma.sql`${sortColumns[orderBy]} ${direction} NULLS LAST, c.id ASC`;
    const db = this.db(tx);
    const [customers, counts] = await Promise.all([
      db.$queryRaw<CustomerListingRow[]>(Prisma.sql`
        SELECT c.id, c.name, c.phone_number AS "phoneNumber", c.phone_country_code AS "phoneCountryCode",
          c.email, c.notes, c.blocked_at AS "blockedAt", c.first_appointment_at AS "firstAppointmentAt",
          c.last_appointment_at AS "lastAppointmentAt", c.total_spent::text AS "totalSpent",
          visits.last_visit_at AS "lastVisitAt", upcoming.next_appointment_at AS "nextAppointmentAt"
        FROM customers c
        LEFT JOIN LATERAL (
          SELECT MAX(a.starts_at) AS last_visit_at FROM appointments a
          WHERE a.customer_id = c.id AND a.tenant_id = c.tenant_id
            AND a.status = 'COMPLETED' AND a.starts_at <= ${now}
        ) visits ON true
        LEFT JOIN LATERAL (
          SELECT MIN(a.starts_at) AS next_appointment_at FROM appointments a
          WHERE a.customer_id = c.id AND a.tenant_id = c.tenant_id
            AND a.status IN ('PENDING', 'CONFIRMED') AND a.starts_at >= ${now}
        ) upcoming ON true
        WHERE ${where}
        ORDER BY ${sorting}
        LIMIT ${take} OFFSET ${skip}
      `),
      db.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT COUNT(*) AS total FROM customers c WHERE ${where}`),
    ]);
    return { data: customers, meta: { total: Number(counts[0].total), skip, take } };
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
