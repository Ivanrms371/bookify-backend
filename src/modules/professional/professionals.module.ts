import { Module, forwardRef } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

import { ProfessionalsRepository } from './professionals.repository';
import { StatsModule } from 'src/common/stats/stats.module';
import { ProfessionalWorkingHoursService } from './features/working-hours/working-hours.service';
import { ProfessionalWorkingHoursRepository } from './features/working-hours/working-hours.repository';
import { ProfessionalsController } from './professionals.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [AuthModule, StatsModule, MembershipsModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, ProfessionalsRepository, ProfessionalWorkingHoursService, ProfessionalWorkingHoursRepository],
  exports: [ProfessionalsService, StatsModule, ProfessionalWorkingHoursService],
})
export class ProfessionalsModule {}
