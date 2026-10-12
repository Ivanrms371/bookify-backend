import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class BillingNoticeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCandidates(afterId?: string) {
    return this.prisma.subscription.findMany({
      where: {
        deletedAt: null,
        tenant: { deletedAt: null, isActive: true },
        OR: [{ status: 'TRIAL' }, { status: 'ACTIVE', planId: { in: ['pro', 'pro_plus'] } }],
      },
      select: { id: true, tenantId: true },
      orderBy: { id: 'asc' },
      take: 100,
      ...(afterId ? { cursor: { id: afterId }, skip: 1 } : {}),
    });
  }
}
