import { Module } from '@nestjs/common';
import { ProfessionalStatsService } from './professional-stats.service';

@Module({
  providers: [ProfessionalStatsService],
  exports: [ProfessionalStatsService],
})
export class ProfessionalStatsModule {}
