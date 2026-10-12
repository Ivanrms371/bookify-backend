import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import type { NotificationLimits, TenantUsagePeriod } from './types/tenant-usage.types';

@Injectable()
export class TenantUsageRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findSubscription(tenantId: string, tx: TransactionClient) {
    return this.db(tx).subscription.findUnique({ where: { tenantId } });
  }

  findPeriod(period: TenantUsagePeriod, tx: TransactionClient) {
    return this.db(tx).tenantUsage.findUnique({ where: { tenantId_periodMonth_periodYear: period } });
  }

  createPeriod(period: TenantUsagePeriod, limits: NotificationLimits, now: Date, tx: TransactionClient) {
    return this.db(tx).tenantUsage.create({ data: { ...period, ...limits, lastResetAt: now } });
  }

  updateNotificationLimits(period: TenantUsagePeriod, limits: Partial<NotificationLimits>, tx: TransactionClient) {
    return this.db(tx).tenantUsage.update({ where: { tenantId_periodMonth_periodYear: period }, data: limits });
  }

  countProfessionals(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).professional.count({ where: { tenantId, deletedAt: null } });
  }

  countServices(tenantId: string, tx?: TransactionClient) {
    return this.db(tx).service.count({ where: { tenantId, deletedAt: null } });
  }
}
