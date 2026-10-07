import { Module } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';

import { ProfessionalsRepository } from './professionals.repository';
import { ProfessionalWorkingHoursService } from './features/working-hours/working-hours.service';
import { ProfessionalWorkingHoursRepository } from './features/working-hours/working-hours.repository';
import { ProfessionalsController } from './professionals.controller';
import { WorkingHoursController } from './features/working-hours/working-hours.controller';

@Module({
  controllers: [ProfessionalsController, WorkingHoursController],
  providers: [ProfessionalsService, ProfessionalsRepository, ProfessionalWorkingHoursService, ProfessionalWorkingHoursRepository],
  exports: [ProfessionalsService, ProfessionalWorkingHoursService],
})
export class ProfessionalsModule {}
