import type { WhatsappActivationContact } from './types/whatsapp-activation.type';
import { WhatsappGateway } from '../notifications/infraestructure/gateways/whatsapp.gateway';
import { VerificationsService } from '../verifications/core/verifications.service';
import { AppointmentStatsService } from './stats/appointment-stats.service';
import type { AppointmentMutationContext } from './stats/types/appointment-stats.types';
import { AppointmentCancelledEvent } from './domain/events/appointment-cancelled.event';
import { AppointmentRescheduledEvent } from './domain/events/appointment-rescheduled.event';
import { AvailabilityService } from '../availability/availability.service';
import { CustomersService } from '../customers/customers.service';
import { ProfessionalsService } from '../professionals/professionals.service';
import { ServicesService } from '../services/services.service';
import { AppointmentStatus, CreatedByType, RecipientType } from 'src/generated/prisma/enums';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CancelPublicParams, CreatePublicParams, ReschedulePublicParams } from './appointments.types';
import { addMinutes, parseISO } from 'date-fns';
import { randomBytes } from 'crypto';
import { AppointmentsPublicRepository } from './appointments-public.repository';
import { AppointmentCreatedEvent } from './domain/events/appointment-created.event';

@Injectable()
export class AppointmentsPublicService {
  constructor(
    private readonly appointmentsPublicRepository: AppointmentsPublicRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly customersService: CustomersService,
    private readonly professionalsService: ProfessionalsService,
    private readonly servicesService: ServicesService,
    private readonly stats: AppointmentStatsService,
    private readonly verifications: VerificationsService,
  ) {}

  async findByToken(token: string) {
    const appt = await this.appointmentsPublicRepository.findByTokenForPublic(token);
    if (!appt) {
      throw new NotFoundException('Cita no encontrada.');
    }
    const { customer, ...result } = appt;
    return { ...result, whatsapp: this.whatsappStatus(customer) };
  }

  private whatsappStatus(customer: WhatsappActivationContact | null) {
    return { activated: !!(customer?.phoneVerifiedAt && customer.whatsappOptInAt), available: WhatsappGateway.isOperational() };
  }

  async requestWhatsappVerification(token: string) {
    const appointment = await this.appointmentsPublicRepository.findByToken(token);
    if (!appointment?.customerId) throw new NotFoundException('Cita no encontrada.');
    return this.verifications.requestCustomerVerification(appointment.tenantId, appointment.customerId, undefined, true);
  }

  async create(params: CreatePublicParams) {
    return this.stats.mutate(params.tenantId, (context) => this.createInTransaction(context, params));
  }

  async reschedule(token: string, params: ReschedulePublicParams) {
    const appointment = await this.appointmentsPublicRepository.findByToken(token);
    if (!appointment) throw new NotFoundException('Cita no encontrada.');
    return this.stats.mutate(appointment.tenantId, (context) => this.rescheduleInTransaction(context, token, params));
  }

  async cancel(token: string, params: CancelPublicParams) {
    const appointment = await this.appointmentsPublicRepository.findByToken(token);
    if (!appointment) throw new NotFoundException('Cita no encontrada.');
    return this.stats.mutate(appointment.tenantId, (context) => this.cancelInTransaction(context, token, params));
  }

  private async createInTransaction(context: AppointmentMutationContext, params: CreatePublicParams) {
    const { tenantId, serviceId, professionalId } = params;

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

    const isAvailable = await this.availabilityService.isSlotAvailable({
      startsAt: params.startsAt,
      tenantId,
      professionalId,
      serviceId,
    });

    if (!isAvailable) {
      throw new BadRequestException('El horario seleccionado ya no está disponible.');
    }

    const customer = await this.verifications.eligibleCustomer(params.customerId, tenantId, context.tx);

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
        notes: params.notes,
        price: service.price,
        blocks: {
          create: {
            startsAt,
            endsAt,
          },
        },
      },
      context.tx,
    );

    context.afterCommit('appointment.created', {
      tenantId,
      appointmentId: appointment.id,
    } satisfies AppointmentCreatedEvent);

    return {
      id: appointment.id,
      status: appointment.status,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      durationMinutes: appointment.durationMinutes,
      price: appointment.price,
      manageToken: appointment.manageToken,
      whatsapp: this.whatsappStatus(customer),
    };
  }

  private async rescheduleInTransaction(context: AppointmentMutationContext, token: string, params: ReschedulePublicParams) {
    const appt = await this.appointmentsPublicRepository.findByToken(token, context.tx);
    if (!appt) {
      throw new NotFoundException('Cita no encontraada');
    }

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
      excludeAppointmentId: appt.id,
    });

    if (!isAvailable) {
      throw new BadRequestException('El horario seleccionado ya no está disponible.');
    }

    const endsAt = addMinutes(startsAt, service.durationMinutes);

    const updated = await this.appointmentsPublicRepository.update(
      token,
      {
        startsAt,
        endsAt,
        durationMinutes: service.durationMinutes,
        rescheduleReason: params.rescheduleReason,
        rescheduleCount: { increment: 1 },
        blocks: {
          deleteMany: {},
          create: { startsAt, endsAt },
        },
      },
      context.tx,
    );
    if (appt.customerId)
      context.afterCommit('appointment.rescheduled', {
        appointmentId: appt.id,
        tenantId,
        previousStartsAt: appt.startsAt,
        rescheduleReason: params.rescheduleReason,
        rescheduledByName: appt.customerName ?? '',
        rescheduledBy: RecipientType.CUSTOMER,
      } satisfies AppointmentRescheduledEvent);
    return updated;
  }

  private async cancelInTransaction(context: AppointmentMutationContext, token: string, params: CancelPublicParams) {
    const appt = await this.appointmentsPublicRepository.findByToken(token, context.tx);
    if (!appt) {
      throw new NotFoundException('Cita no encontraada');
    }
    if (appt.status === AppointmentStatus.CANCELLED) {
      return appt;
    }
    if (appt.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Esta cita no puede ser cancelada.');
    }

    const updated = await this.appointmentsPublicRepository.cancel(
      token,
      {
        cancellationReason: params.cancellationReason,
      },
      context.tx,
    );
    if (appt.customerId)
      context.afterCommit('appointment.cancelled', {
        appointmentId: appt.id,
        tenantId: appt.tenantId,
        cancellationReason: params.cancellationReason ?? '',
        cancelledByName: appt.customerName ?? '',
        cancelledBy: RecipientType.CUSTOMER,
      } satisfies AppointmentCancelledEvent);
    return updated;
  }
}
