import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { SettingsRepository } from './settings.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  create(tenantId: string, tx: TransactionClient) {
    return this.settingsRepository.create(
      {
        tenant: { connect: { id: tenantId } },
      },
      tx,
    );
  }
}
