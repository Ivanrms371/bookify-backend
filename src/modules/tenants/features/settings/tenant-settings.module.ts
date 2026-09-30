import { Module } from '@nestjs/common';
import { TenantSettingsController } from './tenant-settings.controller';
import { TenantSettingsRepository } from './tenant-settings.repository';
import { TenantSettingsService } from './tenant-settings.service';
import { ScheduleExceptionController } from './exceptions/schedule-exception.controller';
import { ScheduleExceptionService } from './exceptions/schedule-exception.service';
import { ScheduleExceptionRepository } from './exceptions/schedule-exception.repository';
import { TenantWorkingHoursController } from './working-hours/tenant-working-hours.controller';
import { TenantWorkingHoursService } from './working-hours/tenant-working-hours.service';
import { TenantWorkingHoursRepository } from './working-hours/tenant-working-hours.repository';

@Module({
  controllers: [TenantSettingsController, ScheduleExceptionController, TenantWorkingHoursController],
  providers: [
    TenantSettingsService,
    TenantSettingsRepository,
    ScheduleExceptionService,
    ScheduleExceptionRepository,
    TenantWorkingHoursService,
    TenantWorkingHoursRepository,
  ],
  exports: [TenantSettingsService],
})
export class TenantSettingsModule {}
