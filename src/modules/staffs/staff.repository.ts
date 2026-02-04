import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import {
  StaffCreateInput,
  StaffUpdateInput,
  TransactionClient,
} from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StaffRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findManyByBusiness(businessId: string, client?: TransactionClient) {
    return this.db(client).staff.findMany({
      where: { businessId, deletedAt: null },
    });
  }

  findPublicByBusiness(businessId: string, client?: TransactionClient) {
    return this.db(client).staff.findMany({
      where: { businessId, isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  findExistingMember(email: string, businessId: string, client?: TransactionClient) {
    return this.db(client).staff.findFirst({
      where: { user: { email }, businessId },
    });
  }

  findById(id: string, client?: TransactionClient) {
    return this.db(client).staff.findUnique({
      where: { id },
    });
  }

  findByUserIdAndBusinessId(userId: string, businessId: string, client?: TransactionClient) {
    return this.db(client).staff.findUnique({
      where: { userId, businessId },
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
