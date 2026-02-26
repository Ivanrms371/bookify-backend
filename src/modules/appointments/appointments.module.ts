import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentCreationService } from './application/services/appointment-creation.service';
import { AppointmentCancelationService } from './application/services/appointment-cancelation.service';
import { AppointmentReschedulingService } from './application/services/appointment-rescheduling.service';
import { AppointmentsRepository } from './infrastructure/appointments.repository';
import { CustomersModule } from '../customers/customers.module';
import { ServicesModule } from '../services/services/services.module';
import { StaffsModule } from '../staffs/staffs.module';
import { InfrastructureModule } from 'src/shared/infrastructure/infrastructure.module';
import { AvailabilityPolicy } from './domain/policies/appointment-creation.policy';

@Module({
  imports: [CustomersModule, ServicesModule, StaffsModule, InfrastructureModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentCreationService,
    AppointmentCancelationService,
    AppointmentReschedulingService,
    AppointmentsRepository,
    AvailabilityPolicy,
  ],
  exports: [AppointmentCancelationService, AppointmentReschedulingService],
})
export class AppointmentsModule {}
