import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { SettingsRepository } from './settings.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  create(businessId: string, tx: TransactionClient) {
    return this.settingsRepository.create(
      {
        business: { connect: { id: businessId } },
      },
      tx,
    );
  }
}
