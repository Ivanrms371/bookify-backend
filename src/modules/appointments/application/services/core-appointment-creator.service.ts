import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateAppointmentDto } from '../../dto/create-appointment.dto';
import { buildTimeBlocks } from '../../domain/appointment-block.builder';
import { CustomersService } from 'src/modules/tenants/features/customers/customers.service';
import { ServicesService } from 'src/modules/tenants/features/services/services/services.service';
import { AppointmentCancelationService } from './appointment-cancelation.service';
import { AppointmentReschedulingService } from './appointment-rescheduling.service';
import { AppointmentStatsService } from './appointment-stats.service';

@Injectable()
export class CoreAppointmentCreator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly servicesService: ServicesService,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentCancelationService: AppointmentCancelationService,
    private readonly appointmentReschedulingService: AppointmentReschedulingService,
    private readonly appointmentStatsService: AppointmentStatsService,
  ) {}

  private generateConfirmationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async create(dto: CreateAppointmentDto & { status?: string }) {
    const startTime = new Date(dto.appointment.date);
    const service = await this.servicesService.findServiceByIdAndStaff(dto.appointment.serviceId, dto.appointment.staffId);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const { customer, isNewCustomer } = await this.customersService.findOrCreate(dto.appointment.tenantId, dto.customer);

      const { rescheduleUrl, rescheduleToken } = await this.appointmentReschedulingService.generateRescheduleUrl();
      const { cancelUrl, cancelToken } = await this.appointmentCancelationService.generateCancelUrl();

      const appointment = await this.appointmentsRepository.create(
        {
          tenant: { connect: { id: dto.appointment.tenantId } },
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

      await this.appointmentStatsService.onCreated(
        {
          customerId: appointment.customerId,
          staffId: appointment.staffId,
          tenantId: appointment.tenantId,
          isNewCustomer,
          startTime,
        },
        tx,
      );

      return {
        customer,
        appointment,
        cancelUrl,
        rescheduleUrl,
      };
    });

    return result;
  }
}
