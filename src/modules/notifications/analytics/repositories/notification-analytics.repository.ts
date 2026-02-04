import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationAnalyticsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
}
