import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';
import { UpdateTenantWorkingHoursDto } from './dto/update-tenant-working-hours.dto';
import { dayOfWeekToInt } from 'src/common/utils/day-of-week.util';
import { timeToMinutes } from 'src/common/utils/time.util';
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
    return this.tenantSettingsRepository.updateGeneralSettings(tenantId, data);
  }

  async updateAppointmentSettings(tenantId: string, data: UpdateAppointmentSettingsDto): Promise<UpdateTenantAppointmentSettingsResponse> {
    return this.tenantSettingsRepository.updateAppointmentSettings(tenantId, data);
  }

  
  async updateWorkingHours(tenantId: string, dto: UpdateTenantWorkingHoursDto): Promise<{ success: boolean }> {
    const workingHours = dto.workingHours.flatMap((wh) => {
      return wh.intervals.map((i) => {
        const dayOfWeek = dayOfWeekToInt(wh.dayOfWeek);
        const opensAt = timeToMinutes(i.opensAt);
        const closesAt = timeToMinutes(i.closesAt);

        return {
          tenantId,
          dayOfWeek,
          opensAt,
          closesAt,
        };
      });
    });

    await this.prisma.$transaction(async (tx) => {
      await this.tenantSettingsRepository.replaceWorkingHours(tenantId, workingHours, tx);
    });

    return { success: true };
  }

  async getAppointmentConfig(tenantId: string): Promise<TenantAppointmentConfigResponse> {
    const settings = await this.tenantSettingsRepository.getAppointmentConfig(tenantId);
    if (!settings) {
      throw new NotFoundException('Tenant not found');
    }
    return settings;
  }
}
