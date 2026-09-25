import { Module } from '@nestjs/common';
import { ScheduleExceptionController } from './exceptions/schedule-exception.controller';
import { ScheduleExceptionService } from './exceptions/schedule-exception.service';
import { ScheduleExceptionRepository } from './repositories/schedule-exception.repository';

@Module({
  imports: [],
  controllers: [ScheduleExceptionController],
  providers: [ScheduleExceptionService, ScheduleExceptionRepository],
  exports: [ScheduleExceptionService],
})
export class ScheduleModule {}
