import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import {
  BusinessSettingsCreateInput,
  BusinessSettingsUpdateInput,
} from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class SettingsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  create(data: BusinessSettingsCreateInput, tx?: TransactionClient) {
    return this.db(tx).businessSettings.create({
      data,
    });
  }
}
