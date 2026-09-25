import { Module, forwardRef } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

import { ProfessionalsRepository } from './professionals.repository';
import { StatsModule } from 'src/common/stats/stats.module';
import { ProfessionalWorkingHoursService } from './features/working-hours/working-hours.service';
import { ProfessionalWorkingHoursRepository } from './features/working-hours/working-hours.repository';
import { ProfessionalsController } from './professionals.controller';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [StatsModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, ProfessionalsRepository, ProfessionalWorkingHoursService, ProfessionalWorkingHoursRepository],
  exports: [ProfessionalsService, StatsModule, ProfessionalWorkingHoursService],
})
export class ProfessionalsModule {}
