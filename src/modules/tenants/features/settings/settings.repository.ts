import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { BaseRepository } from 'src/common/database/base.repository';
import { TenantSettingsCreateInput, TenantSettingsUpdateInput } from 'src/generated/prisma/models';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateAppointmentSettingsDto } from './dto/update-appointment-settings.dto';

@Injectable()
export class SettingsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }
  async getSettings(tenantId: string) {
    return this.db().tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        slug: true,
        logoUrl: true,
        logoPublicId: true,
        coverUrl: true,
        coverPublicId: true,
        phone: true,
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

  async updateGeneralSettings(tenantId: string, data: UpdateGeneralSettingsDto) {
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

  async updateAppointmentSettings(tenantId: string, data: UpdateAppointmentSettingsDto) {
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
