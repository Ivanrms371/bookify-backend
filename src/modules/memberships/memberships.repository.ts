import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MembershipUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { BaseRepository } from 'src/common/database/base.repository';

@Injectable()
export class MembershipsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).membership.findMany({
      where: { tenantId },
      select: {
        id: true,
        userId: true,
        role: true,
        isActive: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            professional: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                colorTheme: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).membership.findUnique({
      where: { id, tenantId },
    });
  }

  async findByUserId(tenantId: string, userId: string, tx?: TransactionClient) {
    return this.db(tx).membership.findFirst({
      where: { tenantId, userId },
    });
  }

  async create(tenantId: string, userId: string, role: string, tx?: TransactionClient) {
    return this.db(tx).membership.create({
      data: {
        tenantId,
        userId,
        role: role as any,
      },
    });
  }

  async update(tenantId: string, id: string, data: MembershipUpdateInput, tx?: TransactionClient) {
    return this.db(tx).membership.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).membership.delete({
      where: { id, tenantId },
    });
  }
}
