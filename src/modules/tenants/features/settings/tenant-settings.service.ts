import { getLocationCountry, resolveLocationSelection, resolveLocationRegion } from 'src/shared/location/location-catalog';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
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
  constructor(
    private readonly tenantSettingsRepository: TenantSettingsRepository,
    private readonly prisma: PrismaService,
  ) {}

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
    // Older clients can still submit preferences, but the backend derives their values.
    const { currency: _currency, timeZone: _timeZone, ...profile } = data;
    const previous = await this.tenantSettingsRepository.getSettings(tenantId);
    if (!previous) throw new NotFoundException('Tenant not found');
    const selectedCountry = profile.country ?? previous.country;
    if (!selectedCountry) return this.tenantSettingsRepository.updateGeneralSettings(tenantId, profile);
    const country = getLocationCountry(selectedCountry);
    const changedCountry = (previous.country || '').toUpperCase() !== country.code && previous.country !== country.label;
    const province = profile.province ?? (changedCountry ? '' : previous.province || '');
    const region = province ? resolveLocationRegion(country.code, province) : null;
    const derived = resolveLocationSelection(country.code, province);
    return this.tenantSettingsRepository.updateGeneralSettings(tenantId, {
      ...profile,
      country: country.code,
      province: region?.value || '',
      ...(changedCountry && profile.city === undefined ? { city: '' } : {}),
      ...derived,
    });
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
