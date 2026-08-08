import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { PublicAppointmentsController } from './public-appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { AuthModule } from 'src/auth/auth.module';
import { AvailabilityModule } from '../availability/availability.module';
import { CustomersModule } from '../customers/customers.module';
import { ProfessionalsModule } from '../professional/professionals.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [AuthModule, AvailabilityModule, CustomersModule, ProfessionalsModule, ServicesModule],
  controllers: [AppointmentsController, PublicAppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
