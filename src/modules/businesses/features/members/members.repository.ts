import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { BusinessMemberCreateInput, BusinessMemberUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class MembersRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByUserAndBusiness(userId: string, businessId: string, client?: TransactionClient) {
    return this.db(client).businessMember.findUnique({
      where: {
        userId_businessId: { userId, businessId },
      },
    });
  }

  async create(data: BusinessMemberCreateInput, client?: TransactionClient) {
    return this.db(client).businessMember.create({ data });
  }

  async update(id: string, data: BusinessMemberUpdateInput, client?: TransactionClient) {
    return this.db(client).businessMember.update({ where: { id }, data });
  }
}
