import { Injectable } from '@nestjs/common';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { OnAppointmentCompletedData } from '../../domain/types/on-appointment-completed.type';
import { CustomerStatsService } from 'src/common/stats/customer-stats.service';
import { EmployeeStatsService } from 'src/common/stats/employee-stats.service';
import { TenantStatsService } from 'src/common/stats/tenant-stats.service';
import { OnAppointmentCreatedData } from '../../domain/types/on-appointment-created.type';
import { OnAppointmentNoShowData } from '../../domain/types/on-appointment-no-show.type';
import { OnAppointmentCancelledData } from '../../domain/types/on-appointment-cancelled.type';

@Injectable()
export class AppointmentStatsService {
  constructor(
    private readonly customerStatsService: CustomerStatsService,
    private readonly employeeStatsService: EmployeeStatsService,
    private readonly tenantStatsService: TenantStatsService,
  ) {}

  async onCreated(data: OnAppointmentCreatedData, tx: TransactionClient) {
    await Promise.all([
      this.customerStatsService.onAppointmentCreated(data, tx),
      this.employeeStatsService.onAppointmentCreated(data, tx),
      this.tenantStatsService.onAppointmentCreated(data, tx),
    ]);
  }

  async onCompleted(data: OnAppointmentCompletedData, tx: TransactionClient) {
    await Promise.all([
      this.customerStatsService.onAppointmentCompleted(data, tx),
      this.employeeStatsService.onAppointmentCompleted(data, tx),
      this.tenantStatsService.onAppointmentCompleted(data, tx),
    ]);
  }

  async onCancelled(data: OnAppointmentCancelledData, tx: TransactionClient) {
    await Promise.all([
      this.customerStatsService.onAppointmentCancelled(data, tx),
      this.employeeStatsService.onAppointmentCancelled(data, tx),
      this.tenantStatsService.onAppointmentCancelled(data, tx),
    ]);
  }

  async onNoShow(data: OnAppointmentNoShowData, tx: TransactionClient) {
    await Promise.all([
      this.customerStatsService.onAppointmentNoShow(data, tx),
      this.employeeStatsService.onAppointmentNoShow(data, tx),
      this.tenantStatsService.onAppointmentNoShow(data, tx),
    ]);
  }

  async onRescheduled() {}
}
