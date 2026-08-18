import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MembershipUpdateInput, TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string) {
    return this.prisma.membership.findMany({
      where: { tenantId },
    });
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.membership.findUnique({
      where: { id, tenantId },
    });
  }

  async findByUserId(tenantId: string, userId: string, tx?: TransactionClient) {
    const client = tx || this.prisma;
    return client.membership.findFirst({
      where: { tenantId, userId },
    });
  }

  async create(tenantId: string, userId: string, role: string) {
    return this.prisma.membership.create({
      data: {
        tenantId,
        userId,
        role: role as any,
      },
    });
  }

  async update(tenantId: string, id: string, data: MembershipUpdateInput, tx?: TransactionClient) {
    const client = tx || this.prisma;
    return client.membership.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.membership.delete({
      where: { id, tenantId },
    });
  }
}
