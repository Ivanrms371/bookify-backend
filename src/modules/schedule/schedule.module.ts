import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ScheduleExceptionController } from './exceptions/schedule-exception.controller';
import { ScheduleExceptionService } from './exceptions/schedule-exception.service';
import { ScheduleExceptionRepository } from './repositories/schedule-exception.repository';

@Module({
  imports: [AuthModule],
  controllers: [ScheduleExceptionController],
  providers: [ScheduleExceptionService, ScheduleExceptionRepository],
  exports: [ScheduleExceptionService],
})
export class ScheduleModule {}
