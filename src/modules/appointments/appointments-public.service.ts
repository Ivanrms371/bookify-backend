import { PrismaService } from 'src/shared/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AvailabilityService } from '../availability/availability.service';
import { CustomersService } from '../customers/customers.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { ServicesService } from '../services/services.service';
import { AppointmentStatus, CreatedByType } from 'src/generated/prisma/enums';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CancelPublicParams, CreatePublicParams, ReschedulePublicParams } from './appointments.types';
import { addMinutes, parseISO } from 'date-fns';
import { randomBytes } from 'crypto';
import { AppointmentsPublicRepository } from './appointments-public.repository';
import { AppointmentCreatedEvent } from './domain/events/appointment-created.event';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

@Injectable()
export class AppointmentsPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appointmentsPublicRepository: AppointmentsPublicRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly customersService: CustomersService,
    private readonly professionalsService: ProfessionalsService,
    private readonly servicesService: ServicesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findByToken(token: string) {
    const appt = await this.appointmentsPublicRepository.findByTokenForPublic(token);
    if (!appt) {
      throw new NotFoundException('Cita no encontrada.');
    }
    return appt;
  }

  async create(params: CreatePublicParams) {
    const { tenantId, serviceId, professionalId, customerEmail, customerName, customerPhone, customerPhoneCode } = params;

    const customer = await this.customersService.findByPhoneOrCreate(params.tenantId, {
      email: customerEmail,
      name: customerName,
      phoneNumber: customerPhone,
      phoneCountryCode: customerPhoneCode,
    });

    const professional = await this.professionalsService.findById(tenantId, professionalId);
    if (!professional) {
      throw new NotFoundException('Profesional no encontrado.');
    }

    const service = await this.servicesService.findByIdAndProfessional(tenantId, serviceId, professionalId);
    if (!service) {
      throw new NotFoundException('Servicio no encontrado.');
    }

    const startsAt = parseISO(params.startsAt);
    const endsAt = addMinutes(startsAt, service.durationMinutes);
    const manageToken = randomBytes(32).toString('hex');

    const appointment = await this.prisma.$transaction(async (tx) => {
      const isAvailable = await this.availabilityService.isSlotAvailable({
        startsAt: params.startsAt,
        tenantId,
        professionalId,
        serviceId,
      });

      if (!isAvailable) {
        throw new BadRequestException('El horario seleccionado ya no está disponible.');
      }

      const appointment = await this.appointmentsPublicRepository.create(
        {
          tenant: { connect: { id: tenantId } },
          professional: { connect: { id: professionalId } },
          customer: { connect: { id: customer.id } },
          service: { connect: { id: serviceId } },
          startsAt,
          endsAt,
          manageToken,
          status: AppointmentStatus.CONFIRMED,
          customerName: customer.name,
          customerPhone: customer.phoneNumber,
          customerEmail: customer.email,
          durationMinutes: service.durationMinutes,
          notes: customer.notes,
          price: service.price,
          blocks: {
            create: {
              startsAt,
              endsAt,
            },
          },
        },
        tx,
      );

      return appointment;
    });

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
      createdBy: CreatedByType.CUSTOMER,
    } satisfies AppointmentCreatedEvent);

    return appointment;
  }

  async reschedule(token: string, params: ReschedulePublicParams) {
    const appt = await this.appointmentsPublicRepository.findByToken(token);
    if (!appt) {
      throw new NotFoundException('Cita no encontraada');
    }

    console.log(appt);

    if (appt.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Esta cita no puede ser reprogramada.');
    }

    if (appt.rescheduleCount > 0) {
      throw new BadRequestException('No puedes reagendar más de una vez.');
    }

    const startsAt = parseISO(params.startsAt);

    if (appt.startsAt.getTime() === startsAt.getTime()) {
      throw new BadRequestException('El horario seleccionado es igual al que ya tienes reservado.');
    }

    const { professionalId, serviceId, tenantId, service } = appt;

    const isAvailable = await this.availabilityService.isSlotAvailable({
      professionalId,
      serviceId,
      startsAt: params.startsAt,
      tenantId,
      ignoreMinAdvanced: false,
    });

    if (!isAvailable) {
      throw new BadRequestException('El horario seleccionado ya no está disponible.');
    }

    const endsAt = addMinutes(startsAt, service.durationMinutes);

    return this.appointmentsPublicRepository.update(token, {
      startsAt,
      endsAt,
      rescheduleReason: params.rescheduleReason,
      rescheduleCount: { increment: 1 },
      blocks: {
        deleteMany: {},
        create: { startsAt, endsAt },
      },
    });
  }

  async cancel(token: string, params: CancelPublicParams) {
    const appt = await this.appointmentsPublicRepository.findByToken(token);
    if (!appt) {
      throw new NotFoundException('Cita no encontraada');
    }
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Esta cita ya fue cancelada');
    }
    if (appt.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Esta cita no puede ser cancelada.');
    }

    return this.appointmentsPublicRepository.cancel(token, {
      cancellationReason: params.cancellationReason,
    });
  }
}
