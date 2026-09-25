import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { InvitationCreateInput } from 'src/generated/prisma/models';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class InvitationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByEmail(tenantId: string, email: string, tx?: TransactionClient) {
    return this.db(tx).invitation.findFirst({
      where: {
        tenantId,
        email,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).invitation.findUnique({
      where: {
        id,
        tenantId,
      },
    });
  }

  async findByToken(token: string, tx?: TransactionClient) {
    return this.db(tx).invitation.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async create(data: InvitationCreateInput, tx?: TransactionClient) {
    return this.db(tx).invitation.create({
      data,
    });
  }

  async revoke(tenantId: string, id: string, tx?: TransactionClient) {
    return this.db(tx).invitation.update({
      where: {
        id,
        tenantId,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async accept(id: string, tx?: TransactionClient) {
    return this.db(tx).invitation.update({
      where: { id },
      data: {
        acceptedAt: new Date(),
      },
    });
  }

  async revokeByProfessionalId(tenantId: string, professionalId: string, tx?: TransactionClient) {
    return this.db(tx).invitation.updateMany({
      where: {
        tenantId,
        professionalId,
        acceptedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findPendingByProfessionalId(tenantId: string, professionalId: string, tx?: TransactionClient) {
    return this.db(tx).invitation.findFirst({
      where: {
        tenantId,
        professionalId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any, tx?: TransactionClient) {
    return this.db(tx).invitation.update({
      where: { id },
      data,
    });
  }

  async findPending(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).invitation.findMany({
      where: {
        tenantId,
        acceptedAt: null,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        professional: {
          select: { name: true },
        },
      },
    });
  }
}
