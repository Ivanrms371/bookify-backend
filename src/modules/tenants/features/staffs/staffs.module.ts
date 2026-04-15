import { Module } from '@nestjs/common';
import { StaffsService } from './staffs.service';

import { StaffsRepository } from './staffs.repository';
import { StatsModule } from 'src/common/stats/stats.module';
import { WorkingHoursController } from './features/working-hours/working-hours.controller';
import { ScheduleExceptionsController } from './features/schedule-exceptions/schedule-exceptions.controller';
import { WorkingHoursService } from './features/working-hours/working-hours.service';
import { WorkingHoursRepository } from './features/working-hours/working-hours.repository';
import { ScheduleExceptionsService } from './features/schedule-exceptions/schedule-exceptions.service';
import { ScheduleExceptionsRepository } from './features/schedule-exceptions/schedule-exceptions.repository';
import { StaffsController } from './staffs.controller';

@Module({
  imports: [StatsModule],
  controllers: [StaffsController, WorkingHoursController, ScheduleExceptionsController],
  providers: [
    StaffsService,
    StaffsRepository,
    WorkingHoursService,
    WorkingHoursRepository,
    ScheduleExceptionsService,
    ScheduleExceptionsRepository,
  ],
  exports: [StaffsService, StatsModule, WorkingHoursService, ScheduleExceptionsService],
})

export class StaffsModule {}
