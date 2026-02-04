import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/database/base.repository';
import { NotificationLogCreateInput } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationLogRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: NotificationLogCreateInput) {
    return this.prisma.notificationLog.create({ data });
  }
}
