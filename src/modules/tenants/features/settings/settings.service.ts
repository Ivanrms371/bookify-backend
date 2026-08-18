import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { SettingsRepository } from './settings.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async getSettings(tenantId: string) {
    const settings = await this.settingsRepository.getSettings(tenantId);
    if (!settings) {
      throw new NotFoundException('Tenant not found');
    }
    return settings;
  }

  async updateGeneralSettings(tenantId: string, data: UpdateGeneralSettingsDto) {
    return this.settingsRepository.updateGeneralSettings(tenantId, data);
  }

  async updateAppointmentSettings(tenantId: string, data: UpdateAppointmentSettingsDto) {
    return this.settingsRepository.updateAppointmentSettings(tenantId, data);
  }
}
