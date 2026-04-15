import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { MembershipCreateInput, MembershipUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class MembershipsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByUserAndTenant(userId: string, tenantId: string, client?: TransactionClient) {
    return this.db(client).membership.findUnique({
      where: {
        userId_tenantId: { userId, tenantId },
      },
    });
  }

  async create(data: MembershipCreateInput, client?: TransactionClient) {
    return this.db(client).membership.create({ data, include: { user: true } });
  }

  async update(id: string, data: MembershipUpdateInput, client?: TransactionClient) {
    return this.db(client).membership.update({ where: { id }, data });
  }
}
