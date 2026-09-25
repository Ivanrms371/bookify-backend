import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';
import { TenantSettingsRepository } from './tenant-settings.repository';
import {
  TenantSettingsResponse,
  TenantAppointmentConfigResponse,
  UpdateTenantGeneralSettingsResponse,
  UpdateTenantAppointmentSettingsResponse,
} from './types/tenant-settings.types';
import { formatWorkingHoursForFrontend } from 'src/shared/schedule';

@Injectable()
export class TenantSettingsService {
  constructor(private readonly tenantSettingsRepository: TenantSettingsRepository) {}

  async getSettings(tenantId: string): Promise<TenantSettingsResponse> {
    const settings = await this.tenantSettingsRepository.getSettings(tenantId);
    if (!settings) {
      throw new NotFoundException('Tenant not found');
    }
    return {
      ...settings,
      tenantWorkingHours: formatWorkingHoursForFrontend(settings.tenantWorkingHours),
    };
  }

  async updateGeneralSettings(tenantId: string, data: UpdateGeneralSettingsDto): Promise<UpdateTenantGeneralSettingsResponse> {
    return this.tenantSettingsRepository.updateGeneralSettings(tenantId, data);
  }

  async updateAppointmentSettings(tenantId: string, data: UpdateAppointmentSettingsDto): Promise<UpdateTenantAppointmentSettingsResponse> {
    return this.tenantSettingsRepository.updateAppointmentSettings(tenantId, data);
  }

  async getAppointmentConfig(tenantId: string): Promise<TenantAppointmentConfigResponse> {
    const settings = await this.tenantSettingsRepository.getAppointmentConfig(tenantId);
    if (!settings) {
      throw new NotFoundException('Tenant not found');
    }
    return settings;
  }
}
