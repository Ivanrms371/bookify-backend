import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { MembershipRole } from 'src/generated/prisma/enums';
import { InvitationStatus } from 'src/generated/prisma/enums';
import { InvitationCreateInput } from 'src/generated/prisma/models';

@Injectable()
export class InvitationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: InvitationCreateInput) {
    return this.prisma.invitation.create({ data });
  }

  async findByToken(token: string) {
    return this.prisma.invitation.findUnique({ where: { token, status: InvitationStatus.PENDING } });
  }

  async findById(id: string) {
    return this.prisma.invitation.findUnique({ where: { id, status: InvitationStatus.PENDING } });
  }

  async update(id: string, data: any) {
    return this.prisma.invitation.update({
      where: { id },
      data,
    });
  }

  async updateStatus(token: string, status: InvitationStatus) {
    return this.prisma.invitation.update({
      where: { token },
      data: { status },
    });
  }

  async findByEmail(tenantId: string, email: string) {
    return this.prisma.invitation.findFirst({
      where: { tenantId, email, status: { in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMany(tenantId: string) {
    return this.prisma.invitation.findMany({
      where: { tenantId, status: InvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phoneCountryCode: true,
        phone: true,
        role: true,
        status: true,
        commissionType: true,
        commissionAmount: true,
        serviceIds: true,
        schedule: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }
}
