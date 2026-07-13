import { Module } from '@nestjs/common';
import { WidgetAppointmentsController } from './controllers/widget-appointments.controller';
import { TenantAppointmentsController } from './controllers/tenant-appointments.controller';
import { CoreAppointmentCreator } from './application/services/core-appointment-creator.service';
import { WidgetAppointmentUseCase } from './application/usecases/widget-appointment.usecase';
import { EmployeeAppointmentUseCase } from './application/usecases/employee-appointment.usecase';
import { AppointmentCancelationService } from './application/services/appointment-cancelation.service';
import { AppointmentReschedulingService } from './application/services/appointment-rescheduling.service';
import { AppointmentsRepository } from './infrastructure/appointments.repository';
import { CustomersModule } from '../tenants/features/customers/customers.module';
import { ServicesModule } from '../tenants/features/services/services/services.module';
import { EmployeesModule } from '../tenants/features/employees/employees.module';
import { InfrastructureModule } from 'src/shared/infrastructure/infrastructure.module';
import { AvailabilityPolicy } from './domain/policies/appointment-creation.policy';
import { AppointmentsService } from './application/services/appointments.service';
import { TenantAppointmentsService } from './application/services/tenant-appointments.service';
import { StatsModule } from 'src/common/stats/stats.module';
import { AppointmentStatsService } from './application/services/appointment-stats.service';
import { AppointmentCompletationScheduler } from './application/schedulers/appointment-completion.scheduler';

@Module({
  imports: [CustomersModule, ServicesModule, EmployeesModule, InfrastructureModule, StatsModule],
  controllers: [WidgetAppointmentsController, TenantAppointmentsController],
  providers: [
    AppointmentsService,
    TenantAppointmentsService,
    AppointmentStatsService,
    CoreAppointmentCreator,
    WidgetAppointmentUseCase,
    EmployeeAppointmentUseCase,
    AppointmentCancelationService,
    AppointmentReschedulingService,
    AppointmentCompletationScheduler,
    AppointmentsRepository,
    AvailabilityPolicy,
  ],
  exports: [AppointmentsService, AppointmentCancelationService, AppointmentReschedulingService],
})
export class AppointmentsModule {}
