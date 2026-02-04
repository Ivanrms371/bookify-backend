import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BusinessDailyStatsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(businessId: string) {
    return this.prisma.businessDailyStats.create({
      data: { businessId, date: new Date() },
    });
  }
}
