import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { MemberInviteCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class InvitationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: MemberInviteCreateInput, client?: TransactionClient) {
    return this.db(client).memberInvite.create({
      data,
    });
  }

  countPendingByBusiness(businessId: string, client?: TransactionClient) {
    const now = new Date();
    return this.db(client).memberInvite.count({
      where: {
        businessId,
        acceptedAt: null,
        expiresAt: {
          gte: now,
        },
      },
    });
  }

  findValidByToken(token: string, client?: TransactionClient) {
    const now = new Date();
    return this.db(client).memberInvite.findUnique({
      where: { token, acceptedAt: null, expiresAt: { gte: now } },
    });
  }

  findManyByBusiness(businessId: string, client?: TransactionClient) {
    return this.db(client).memberInvite.findMany({
      where: { businessId },
    });
  }

  findPendingByEmail(email: string, businessId: string, client?: TransactionClient) {
    return this.db(client).memberInvite.findFirst({
      where: {
        email,
        businessId,
        acceptedAt: null,
      },
    });
  }

  findPendingById(id: string, client?: TransactionClient) {
    return this.db(client).memberInvite.findUnique({
      where: { id, acceptedAt: null, expiresAt: { gte: new Date() } },
    });
  }

  markAsAccepted(id: string, client?: TransactionClient) {
    return this.db(client).memberInvite.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  }
}
