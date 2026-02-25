import { Module } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { StaffsRepository } from './staffs.repository';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { StaffStatsModule } from './features/stats/staff-stats.module';
import { WorkingHoursController } from './features/working-hours/working-hours.controller';
import { ScheduleExceptionsController } from './features/schedule-exceptions/schedule-exceptions.controller';
import { WorkingHoursService } from './features/working-hours/working-hours.service';
import { WorkingHoursRepository } from './features/working-hours/working-hours.repository';
import { ScheduleExceptionsService } from './features/schedule-exceptions/schedule-exceptions.service';
import { ScheduleExceptionsRepository } from './features/schedule-exceptions/schedule-exceptions.repository';
import { StaffsController } from './staffs.controller';
import { AppointmentCreatedListener } from './listeners/appointment-created.listener';

@Module({
  imports: [PrismaModule, StaffStatsModule],
  controllers: [StaffsController, WorkingHoursController, ScheduleExceptionsController],
  providers: [
    StaffsService,
    StaffsRepository,
    WorkingHoursService,
    WorkingHoursRepository,
    ScheduleExceptionsService,
    ScheduleExceptionsRepository,

    AppointmentCreatedListener,
  ],
  exports: [StaffsService, StaffStatsModule, WorkingHoursService, ScheduleExceptionsService],
})
export class StaffsModule {}
