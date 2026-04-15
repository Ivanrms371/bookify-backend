import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { CustomerCreateInput, CustomerFindManyArgs, CustomerWhereInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { FindAllCustomersParams } from './types/customer-find-all.params';

@Injectable()
export class CustomersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByPhone(tenantId: string, phone: string) {
    return this.db().customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
  }

  async findById(id: string) {
    return this.db().customer.findUnique({ where: { id } });
  }

  async create(customer: CustomerCreateInput) {
    return this.db().customer.create({ data: customer });
  }

  async update(id: string, data: any) {
    return this.db().customer.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.db().customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async block(id: string) {
    return this.db().customer.update({
      where: { id },
      data: { blockedAt: new Date() },
    });
  }

  async unblock(id: string) {
    return this.db().customer.update({
      where: { id },
      data: { blockedAt: null },
    });
  }

  async findAll(params: FindAllCustomersParams) {
    const { tenantId, query, take = 10, skip = 0, orderBy = 'name', order = 'asc' } = params;

    // 1. Simple case without search
    if (!query) {
      return this.db().customer.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { [orderBy]: order },
        take,
        skip,
      });
    }

    // 2. Prepare values for the search
    const search = `%${query}%`;

    // 3. Mapping and strict validation to avoid SQL Injection in RawUnsafe
    const orderByMap: Record<string, string> = {
      name: '"name"',
      createdAt: '"created_at"',
    };

    const sortColumn = orderByMap[orderBy] ?? orderByMap['name'];
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    await this.db().$executeRaw`SET pg_trgm.similarity_threshold = 0.1;`;

    // 4. Execute with $queryRawUnsafe
    return this.db().$queryRawUnsafe<any[]>(
      `
    SELECT *, similarity(name, $1) as score
    FROM "customers"
    WHERE "tenant_id" = $2
    AND "deleted_at" IS NULL
    AND (
      name % $1                               
      OR unaccent(name) ILIKE unaccent($3)    
      OR email ILIKE $3                       
      OR phone ILIKE $3                       
    )
    ORDER BY score DESC, ${sortColumn} ${sortOrder}
    LIMIT $4 OFFSET $5;
  `,
      query,
      tenantId,
      search,
      take,
      skip,
    );
  }
}
