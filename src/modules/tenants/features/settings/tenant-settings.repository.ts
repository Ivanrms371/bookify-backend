import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import {
  RawTenantSettingsResponse,
  TenantAppointmentConfigResponse,
  UpdateTenantGeneralSettingsResponse,
  UpdateTenantAppointmentSettingsResponse,
} from './types/tenant-settings.types';

@Injectable()
export class TenantSettingsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
  async getSettings(tenantId: string): Promise<RawTenantSettingsResponse | null> {
    return this.db().tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        slug: true,
        logoUrl: true,
        logoPublicId: true,
        coverUrl: true,
        coverPublicId: true,
        phoneNumber: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        province: true,
        country: true,
        settings: {
          select: {
            slotIntervalMinutes: true,
            maxAdvancedDays: true,
            minAdvancedMinutes: true,
            bufferTimeMinutes: true,
            cancellationWindowMinutes: true,
            currency: true,
            maxPendingApptsPerClient: true,
            requireConfirmation: true,
            holidayClosureAutoApply: true,
            allowPassiveTimeBooking: true,
            timeZone: true,
          },
        },
        tenantWorkingHours: {
          select: {
            dayOfWeek: true,
            opensAt: true,
            closesAt: true,
          },
        },
      },
    });
  }

  async getAppointmentConfig(tenantId: string): Promise<TenantAppointmentConfigResponse | null> {
    return this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });
  }

  async updateGeneralSettings(tenantId: string, data: UpdateGeneralSettingsDto): Promise<UpdateTenantGeneralSettingsResponse> {
    const { timeZone, ...tenantData } = data;

    return this.db().tenant.update({
      where: { id: tenantId },
      data: {
        ...tenantData,
        ...(timeZone && {
          settings: {
            update: {
              timeZone,
            },
          },
        }),
      },
    });
  }

  
  
  async updateAppointmentSettings(tenantId: string, data: UpdateAppointmentSettingsDto): Promise<UpdateTenantAppointmentSettingsResponse> {
    return this.db().tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          update: data,
        },
      },
    });
  }
}
