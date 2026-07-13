import { Module } from '@nestjs/common';
import { EmployeeStatsService } from './employee-stats.service';

@Module({
  providers: [EmployeeStatsService],
  exports: [EmployeeStatsService],
})
export class EmployeeStatsModule {}
