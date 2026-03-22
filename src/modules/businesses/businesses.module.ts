import { Module } from '@nestjs/common';
import { MediaModule } from 'src/shared/media/media.module';
import { PlansModule } from 'src/modules/plans/plans.module';
import { UsersModule } from 'src/modules/users/users.module';
import { MembersModule } from './features/members/members.module';
import { BusinessesController } from './businesses.controller';
import { BusinessQuotaModule } from './features/quota/business-quota.module';
import { BusinessesService } from './businesses.service';
import { BusinessesRepository } from './repositories/businesses.repository.js';
import { AppointmentCreatedListener } from './listeners/appointment-created.listener';
import { BusinessStatsModule } from './features/stats/business-stats.module';
import { AppointmentCancelledListener } from './listeners/appointment-cancelled.listener.js';
import { BusinessWorkingHoursController } from './features/working-hours/business-working-hours.controller';
import { BusinessWorkingHoursService } from './features/working-hours/business-working-hours.service';
import { BusinessWorkingHoursRepository } from './features/working-hours/business-working-hours.repository';

@Module({
  imports: [MediaModule,MembersModule, UsersModule, PlansModule, BusinessStatsModule, BusinessQuotaModule],
  controllers: [BusinessesController, BusinessWorkingHoursController],
  providers: [
    BusinessesService,
    BusinessesRepository,
    AppointmentCreatedListener,
    AppointmentCancelledListener,
    BusinessWorkingHoursService,
    BusinessWorkingHoursRepository,
  ],
  exports: [BusinessesService],
})
export class BusinessesModule {}
