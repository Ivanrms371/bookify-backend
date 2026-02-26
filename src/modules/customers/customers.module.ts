import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersRepository } from './customers.repository';
import { CustomerStatsService } from './customer-stats.service';
import { AppointmentCreatedListener } from './listeners/appointment-created.listener';
import { AppointmentCancelledListener } from './listeners/appointment-cancelled.listener';

@Module({
  providers: [CustomersService, CustomersRepository, CustomerStatsService, AppointmentCreatedListener, AppointmentCancelledListener],
  exports: [CustomersService, CustomerStatsService],
})
export class CustomersModule {}
