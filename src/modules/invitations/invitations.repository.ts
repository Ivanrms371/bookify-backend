import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { MembershipRole } from 'src/generated/prisma/enums';
import type { InvitationStatus } from 'src/generated/prisma/enums';
import { InvitationCreateInput } from 'src/generated/prisma/models';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: InvitationCreateInput) {
    return this.prisma.invitation.create({ data });
  }

  async findByToken(token: string) {
    return this.prisma.invitation.findUnique({ where: { token } });
  }

  async updateStatus(token: string, status: InvitationStatus) {
    return this.prisma.invitation.update({
      where: { token },
      data: { status },
    });
  }

  async findByTenantAndEmail(tenantId: string, email: string) {
    return this.prisma.invitation.findFirst({
      where: { tenantId, email },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }
}
