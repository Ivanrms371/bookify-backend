import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CustomersService } from 'src/modules/customers/customers.service';
import { ProfessionalsService } from 'src/modules/professionals/professionals.service';
import { ServicesService } from 'src/modules/services/services.service';
import { AvailabilityService } from 'src/modules/availability/availability.service';
import { addMinutes, parseISO } from 'date-fns';
import { AppointmentStatus, CreatedByType, RecipientType } from 'src/generated/prisma/enums';
import { randomBytes } from 'crypto';
import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';

import { AppointmentsMapper } from './mappers/appointments.mapper';
import { AppointmentCreatedEvent } from './domain/events/appointment-created.event';
import { AppointmentCancelledEvent } from './domain/events/appointment-cancelled.event';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly customersService: CustomersService,
    private readonly professionalsService: ProfessionalsService,
    private readonly servicesService: ServicesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string, params: FindAllAppointmentsParamsDto) {
    const { data, meta } = await this.appointmentsRepository.findMany(tenantId, params);

    return {
      data: AppointmentsMapper.toResponseList(data),
      meta,
    };
  }

  async findById() {}

  async create(tenantId: string, dto: CreateAppointmentDto) {
    const { customerId, professionalId, serviceId } = dto;

    const [customer, professional, service] = await Promise.all([
      customerId ? this.customersService.findById(tenantId, customerId) : null,
      this.professionalsService.findById(tenantId, professionalId),
      this.servicesService.findByIdAndProfessional(tenantId, serviceId, professionalId),
    ]);

    if (customerId && !customer) {
      throw new NotFoundException('No hemos encontrado al cliente.');
    }

    if (!professional) {
      throw new NotFoundException('No hemos encontrado al profesional.');
    }

    if (!service) {
      throw new NotFoundException('No hemos encontrado el servicio.');
    }

    const startsAt = parseISO(dto.startsAt);
    const endsAt = addMinutes(startsAt, service.durationMinutes);

    const manageToken = randomBytes(32).toString('hex');

    const isAvailable = await this.availabilityService.isSlotAvailable({
      tenantId,
      professionalId,
      serviceId,
      startsAt: dto.startsAt,
      ignoreMinAdvanced: true,
      allowPast: true,
    });

    if (!isAvailable) {
      throw new BadRequestException('El horario seleccionado ya no está disponible.');
    }

    const appointment = await this.appointmentsRepository.create({
      tenant: { connect: { id: tenantId } },
      professional: { connect: { id: professionalId } },
      service: { connect: { id: serviceId } },

      startsAt,
      endsAt,
      manageToken,
      status: AppointmentStatus.PENDING,
      durationMinutes: service.durationMinutes,
      price: service.price,
      createdBy: CreatedByType.STAFF,

      ...(customer && {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phoneNumber,
        customer: {
          connect: {
            id: customer.id,
          },
        },
      }),

      blocks: {
        create: {
          startsAt,
          endsAt,
        },
      },
    });

    if (customer) {
      this.eventEmitter.emit('appointment.created', {
        tenantId,
        userId: professional.userId,
        professionalId,
        professionalName: professional.name,
        serviceId,
        serviceName: service.name,
        customerId: customer.id,
        customerName: customer.name,
        cancelUrl: `/appointments/${manageToken}/cancel`,
        rescheduleUrl: `/appointments/${manageToken}/reschedule`,
        detailsUrl: `${APP_URL}/appointments`,
        startAppointmentDate: startsAt,
        endAppointmentDate: endsAt,
        appointmentId: appointment.id,
        createdBy: CreatedByType.STAFF,
      } satisfies AppointmentCreatedEvent);
    }

    return appointment;
  }

  async reschedule() {}

  async cancel(tenantId: string, id: string, currentUser: AuthenticatedUser, dto: CancelAppointmentDto = {}) {
    const appointment = await this.appointmentsRepository.findById(tenantId, id);

    if (!appointment) {
      throw new NotFoundException('No hemos encontrado la cita.');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Una cita completada no puede ser cancelada.');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return AppointmentsMapper.toResponse(appointment);
    }

    const cancelledAppointment = await this.appointmentsRepository.cancel(tenantId, id, {
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: dto.cancellationReason,
    });

    if (appointment.customerId && appointment.customer) {
      this.eventEmitter.emit('appointment.cancelled', {
        appointmentId: appointment.id,
        tenantId,
        userId: appointment.professional.userId ?? currentUser.id,
        professionalId: appointment.professionalId,
        professionalName: appointment.professional.name,
        customerId: appointment.customerId,
        customerName: appointment.customer.name,
        serviceId: appointment.serviceId,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: AppointmentStatus.CANCELLED,
        cancellationReason: dto.cancellationReason ?? '',
        cancelledByName: currentUser.name,
        cancelledBy: RecipientType.USER,
      } satisfies AppointmentCancelledEvent);
    }

    return AppointmentsMapper.toResponse(cancelledAppointment);
  }
}
