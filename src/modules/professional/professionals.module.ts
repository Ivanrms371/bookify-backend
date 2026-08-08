import { Module, forwardRef } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

import { ProfessionalsRepository } from './professionals.repository';
import { StatsModule } from 'src/common/stats/stats.module';
import { WorkingHoursController } from './features/working-hours/working-hours.controller';
import { ScheduleExceptionsController } from './features/schedule-exceptions/schedule-exceptions.controller';
import { WorkingHoursService } from './features/working-hours/working-hours.service';
import { WorkingHoursRepository } from './features/working-hours/working-hours.repository';
import { ScheduleExceptionsService } from './features/schedule-exceptions/schedule-exceptions.service';
import { ScheduleExceptionsRepository } from './features/schedule-exceptions/schedule-exceptions.repository';
import { ProfessionalsController } from './professionals.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, StatsModule],
  controllers: [ProfessionalsController, WorkingHoursController, ScheduleExceptionsController],
  providers: [
    ProfessionalsService,
    ProfessionalsRepository,
    WorkingHoursService,
    WorkingHoursRepository,
    ScheduleExceptionsService,
    ScheduleExceptionsRepository,
  ],
  exports: [ProfessionalsService, StatsModule, WorkingHoursService, ScheduleExceptionsService],
})
export class ProfessionalsModule {}
