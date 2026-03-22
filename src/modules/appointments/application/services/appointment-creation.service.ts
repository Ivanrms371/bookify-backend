import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { AppointmentCreatedEvent } from '../../domain/events/appointment-created.event';
import { AvailabilityPolicy } from '../../domain/policies/appointment-creation.policy';
import { buildTimeBlocks } from '../../domain/appointment-block.builder';
import { CustomersService } from 'src/modules/customers/customers.service';
import { ServicesService } from 'src/modules/services/services/services.service';
import { AppointmentCancelationService } from './appointment-cancelation.service';
import { AppointmentReschedulingService } from './appointment-rescheduling.service';

@Injectable()
export class AppointmentCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly policy: AvailabilityPolicy,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentCancelationService: AppointmentCancelationService,
    private readonly appointmentReschedulingService: AppointmentReschedulingService,
  ) {}

  private generateConfirmationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createAppointment(dto: CreateAppointmentDto) {
    const startTime = new Date(dto.appointment.date);
    const service = await this.servicesService.findServiceById(dto.appointment.serviceId);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    await this.policy.validate({
      staffId: dto.appointment.staffId,
      serviceId: dto.appointment.serviceId,
      startTime,
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const customer = await this.customersService.findOrCreateCustomer(dto.appointment.businessId, dto.customer);

      const { rescheduleUrl, rescheduleToken } = await this.appointmentReschedulingService.generateRescheduleUrl();
      const { cancelUrl, cancelToken } = await this.appointmentCancelationService.generateCancelUrl();

      const appointment = await this.appointmentsRepository.create(
        {
          business: { connect: { id: dto.appointment.businessId } },
          staff: { connect: { id: dto.appointment.staffId } },
          service: { connect: { id: dto.appointment.serviceId } },
          customer: { connect: { id: customer.id } },
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          price: service.price,
          discountFixed: service.discountFixed,
          discountPercentage: service.discountPercentage,
          confirmationCode: this.generateConfirmationCode(),
          durationMinutes: service.durationMinutes,
          initialActiveMinutes: service.initialActiveMinutes,
          passiveMinutes: service.passiveTimeMinutes,
          finalActiveMinutes: service.finalActiveMinutes,
          rescheduleToken,
          cancelToken,
          startTime,
          endTime,
        },
        tx,
      );

      const timeBlocks = buildTimeBlocks({
        startTime,
        initialActiveMinutes: service.initialActiveMinutes,
        passiveTimeMinutes: service.passiveTimeMinutes,
        finalActiveMinutes: service.finalActiveMinutes,
      });

      const appointmentBlocks = timeBlocks.map((block) => ({
        appointmentId: appointment.id,
        staffId: dto.appointment.staffId,
        startTime: block.startTime,
        endTime: block.endTime,
      }));

      if (appointmentBlocks.length > 0) {
        await tx.appointmentBlock.createMany({ data: appointmentBlocks });
      }

      return {
        customer,
        appointment,
        cancelUrl,
        rescheduleUrl,
      };
    });

    this.eventEmitter.emit('appointment.created', {
      businessId: result.appointment.businessId,
      staffId: result.appointment.staffId,
      serviceId: result.appointment.serviceId,
      customerId: result.customer.id,
      startAppointmentDate: result.appointment.startTime,
      endAppointmentDate: result.appointment.endTime,
      appointmentId: result.appointment.id,
      customerName: result.customer.name,
      staffName: result.appointment.staff.user.name,
      staffPhone: result.appointment.staff.user.phone,
      serviceName: result.appointment.service.name,
      userId: result.appointment.staff.userId,
      cancelUrl: result.cancelUrl,
      rescheduleUrl: result.rescheduleUrl,
    } as AppointmentCreatedEvent);

    return result;
  }
}
