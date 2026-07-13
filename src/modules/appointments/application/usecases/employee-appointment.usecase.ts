import { Injectable } from '@nestjs/common';
import { CoreAppointmentCreator } from '../services/core-appointment-creator.service';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentCreatedEvent } from '../../domain/events/appointment-created.event';

@Injectable()
export class EmployeeAppointmentUseCase {
  constructor(
    private readonly creator: CoreAppointmentCreator,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: CreateAppointmentDto & { overrideAvailability?: boolean }) {
    // Allows booking overriding strict availability policy and limits
    const result = await this.creator.create({ ...dto, status: 'CONFIRMED' });

    this.eventEmitter.emit('appointment.created', {
      tenantId: result.appointment.tenantId,
      employeeId: result.appointment.employeeId,
      serviceId: result.appointment.serviceId,
      customerId: result.customer.id,
      startAppointmentDate: result.appointment.startTime,
      endAppointmentDate: result.appointment.endTime,
      appointmentId: result.appointment.id,
      customerName: result.customer.name,
      employeeName: result.appointment.employee.user.name,
      employeePhone: result.appointment.employee.user.phone,
      serviceName: result.appointment.service.name,
      userId: result.appointment.employee.userId,
      cancelUrl: result.cancelUrl,
      rescheduleUrl: result.rescheduleUrl,
      createdBy: 'EMPLOYEE',
    } as AppointmentCreatedEvent);

    return result;
  }
}
