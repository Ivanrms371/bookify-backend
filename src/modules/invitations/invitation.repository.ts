import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { PrismaClient } from 'src/generated/prisma/client';
import { MemberInviteCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InvitationRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: MemberInviteCreateInput, client?: PrismaClient) {
    return this.db(client).memberInvite.create({
      data,
    });
  }

  findUniqueByToken(token: string, client?: PrismaClient) {
    return this.db(client).memberInvite.findUnique({
      where: { token },
    });
  }

  findManyByBusiness(businessId: string, client?: PrismaClient) {
    return this.db(client).memberInvite.findMany({
      where: { businessId },
    });
  }

  markAsAccepted(token: string, client?: PrismaClient) {
    return this.db(client).memberInvite.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });
  }
}
