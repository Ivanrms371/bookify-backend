import { Module, forwardRef } from '@nestjs/common';
import { EmployeesService } from './employees.service';

import { EmployeesRepository } from './employees.repository';
import { StatsModule } from 'src/common/stats/stats.module';
import { WorkingHoursController } from './features/working-hours/working-hours.controller';
import { ScheduleExceptionsController } from './features/schedule-exceptions/schedule-exceptions.controller';
import { WorkingHoursService } from './features/working-hours/working-hours.service';
import { WorkingHoursRepository } from './features/working-hours/working-hours.repository';
import { ScheduleExceptionsService } from './features/schedule-exceptions/schedule-exceptions.service';
import { ScheduleExceptionsRepository } from './features/schedule-exceptions/schedule-exceptions.repository';
import { EmployeesController } from './employees.controller';
import { ServiceAssignmentsModule } from '../services/service-assigments/service-assignments.module';

@Module({
  imports: [StatsModule],
  controllers: [EmployeesController, WorkingHoursController, ScheduleExceptionsController],
  providers: [
    EmployeesService,
    EmployeesRepository,
    WorkingHoursService,
    WorkingHoursRepository,
    ScheduleExceptionsService,
    ScheduleExceptionsRepository,
  ],
  exports: [EmployeesService, StatsModule, WorkingHoursService, ScheduleExceptionsService],
})
export class EmployeesModule {}
