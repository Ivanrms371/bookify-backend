import { AppointmentStatsService } from './stats/appointment-stats.service';
import { AppointmentStatsRepository } from './stats/appointment-stats.repository';
import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { AvailabilityModule } from '../availability/availability.module';
import { CustomersModule } from '../customers/customers.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { ServicesModule } from '../services/services.module';
import { TenantSettingsModule } from '../tenants/features/settings/tenant-settings.module';
import { AppointmentsPublicService } from './appointments-public.service';
import { AppointmentsPublicRepository } from './appointments-public.repository';

@Module({
  imports: [AvailabilityModule, CustomersModule, ProfessionalsModule, ServicesModule, TenantSettingsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentStatsService, AppointmentStatsRepository, AppointmentsService, AppointmentsPublicService, AppointmentsRepository, AppointmentsPublicRepository],
  exports: [AppointmentsService, AppointmentsPublicService],
})
export class AppointmentsModule {}
