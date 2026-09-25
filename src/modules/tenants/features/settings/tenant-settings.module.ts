import { Module } from '@nestjs/common';
import { TenantSettingsController } from './tenant-settings.controller';
import { TenantSettingsRepository } from './tenant-settings.repository';
import { TenantSettingsService } from './tenant-settings.service';
import { ScheduleExceptionController } from './exceptions/schedule-exception.controller';
import { ScheduleExceptionService } from './exceptions/schedule-exception.service';
import { ScheduleExceptionRepository } from './exceptions/schedule-exception.repository';

@Module({
  controllers: [TenantSettingsController, ScheduleExceptionController],
  providers: [TenantSettingsService, TenantSettingsRepository, ScheduleExceptionService, ScheduleExceptionRepository],
  exports: [TenantSettingsService],
})
export class TenantSettingsModule {}
