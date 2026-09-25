import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { AvailabilityModule } from '../availability/availability.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ServicesModule } from '../services/services.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [TenantsModule, ServicesModule, ProfessionalsModule, AvailabilityModule, AppointmentsModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
