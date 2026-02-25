import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './application/appointments.service';
import { AppointmentsRepository } from './infrastructure/appointments.repository';
import { CustomersModule } from '../customers/customers.module';
import { ServicesModule } from '../services/services/services.module';
import { StaffsModule } from '../staffs/staffs.module';
import { InfrastructureModule } from 'src/shared/infrastructure/infrastructure.module';
import { AvailabilityPolicy } from './domain/policies/appointment-creation.policy';

@Module({
  imports: [CustomersModule, ServicesModule, StaffsModule, InfrastructureModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository, AvailabilityPolicy],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
