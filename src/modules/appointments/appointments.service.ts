import { AppointmentStatsService } from './stats/appointment-stats.service';
import {
  AppointmentNotStartedException,
  AppointmentStatusPermissionException,
  AppointmentStatusTransitionException,
} from './exceptions/appointment-status.exceptions';
import type { AppointmentMutationContext } from './stats/types/appointment-stats.types';
import { AppointmentOwnershipException } from './exceptions/appointment-ownership.exception';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CustomersService } from 'src/modules/customers/customers.service';
import { ProfessionalsService } from 'src/modules/professionals/professionals.service';
import { ServicesService } from 'src/modules/services/services.service';
import { AvailabilityService } from 'src/modules/availability/availability.service';
import { addMinutes, isEqual, isValid, parseISO } from 'date-fns';
import { AppointmentStatus, CreatedByType, RecipientType } from 'src/generated/prisma/enums';
import { randomBytes } from 'crypto';
import { FindAllAppointmentsParamsDto } from './dto/find-all-appointments.dto';

import { AppointmentsMapper } from './mappers/appointments.mapper';
import { AppointmentCreatedEvent } from './domain/events/appointment-created.event';
import { AppointmentCancelledEvent } from './domain/events/appointment-cancelled.event';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { AuthenticatedUser } from 'src/common/security/types/authenticated-request.type';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { Permission, PERMISSIONS } from 'src/common/security/constants/permissions.constant';
import { AppointmentRescheduledEvent } from './domain/events/appointment-rescheduled.event';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly customersService: CustomersService,
    private readonly professionalsService: ProfessionalsService,
    private readonly servicesService: ServicesService,
    private readonly stats: AppointmentStatsService,
  ) {}

  async findAll(
    tenantId: string,
    params: FindAllAppointmentsParamsDto,
    currentUser: AuthenticatedUser,
    permissions: readonly Permission[],
  ) {
    let scopedParams = params;
    if (!permissions.includes(PERMISSIONS.APPOINTMENT_READ_OTHERS)) {
      const professional = await this.professionalsService.findByUserId(tenantId, currentUser.id);
      // Caller-supplied filters must never widen the authenticated professional scope.
      scopedParams = { ...params, professionalId: professional.id };
    }
    const { data, meta } = await this.appointmentsRepository.findMany(tenantId, scopedParams);

    return {
      data: AppointmentsMapper.toResponseList(data),
      meta,
    };
  }

  async findById(tenantId: string, id: string, currentUser: AuthenticatedUser, permissions: readonly Permission[]) {
    const appointment = await this.appointmentsRepository.findById(tenantId, id);
    if (!appointment) throw new NotFoundException('No hemos encontrado la cita.');
    if (!permissions.includes(PERMISSIONS.APPOINTMENT_READ_OTHERS) && appointment.professional.userId !== currentUser.id) {
      throw new AppointmentOwnershipException();
    }
    return AppointmentsMapper.toResponse(appointment);
  }

  async create(tenantId: string, dto: CreateAppointmentDto, currentUser: AuthenticatedUser, permissions: readonly Permission[]) {
    return this.stats.mutate(tenantId, (context) => this.createInTransaction(context, tenantId, dto, currentUser, permissions));
  }

  async reschedule(
    tenantId: string,
    id: string,
    currentUser: AuthenticatedUser,
    permissions: readonly Permission[],
    dto: RescheduleAppointmentDto,
  ) {
    return this.stats.mutate(tenantId, (context) => this.rescheduleInTransaction(context, tenantId, id, currentUser, permissions, dto));
  }

  async cancel(
    tenantId: string,
    id: string,
    currentUser: AuthenticatedUser,
    permissions: readonly Permission[],
    dto: CancelAppointmentDto = {},
  ) {
    return this.stats.mutate(tenantId, (context) => this.cancelInTransaction(context, tenantId, id, currentUser, permissions, dto));
  }

  async changeStatus(
    tenantId: string,
    id: string,
    status: AppointmentStatus,
    currentUser: AuthenticatedUser,
    permissions: readonly Permission[],
  ) {
    return this.stats.mutate(tenantId, async (context) => {
      const appointment = await this.appointmentsRepository.findById(tenantId, id, context.tx);
      if (!appointment) throw new NotFoundException('No hemos encontrado la cita.');
      this.verifyStatusAuthority(appointment.professional.userId, currentUser.id, permissions);
      if (appointment.status === status) return AppointmentsMapper.toResponse(appointment);
      this.verifyStatusTransition(appointment.status, status, appointment.startsAt);
      const updated = await this.appointmentsRepository.update(tenantId, id, { status }, context.tx);
      if (status === AppointmentStatus.COMPLETED || status === AppointmentStatus.NO_SHOW) {
        context.afterCommit('appointment.finished', { appointmentId: id, tenantId });
      }
      return AppointmentsMapper.toResponse(updated);
    });
  }

  private verifyStatusAuthority(professionalUserId: string | null, userId: string, permissions: readonly Permission[]) {
    if (!permissions.includes(PERMISSIONS.APPOINTMENT_UPDATE)) throw new AppointmentStatusPermissionException();
    if (!permissions.includes(PERMISSIONS.APPOINTMENT_UPDATE_OTHERS) && professionalUserId !== userId)
      throw new AppointmentOwnershipException();
  }

  private verifyStatusTransition(previous: AppointmentStatus, next: AppointmentStatus, startsAt: Date) {
    const canConfirm = next === AppointmentStatus.CONFIRMED && previous === AppointmentStatus.PENDING;
    const canFinish =
      (next === AppointmentStatus.COMPLETED || next === AppointmentStatus.NO_SHOW) &&
      (previous === AppointmentStatus.CONFIRMED ||
        previous === AppointmentStatus.PENDING ||
        previous === AppointmentStatus.NO_SHOW ||
        previous === AppointmentStatus.COMPLETED);
    if (!canConfirm && !canFinish) throw new AppointmentStatusTransitionException();
    if (canFinish && startsAt > new Date()) throw new AppointmentNotStartedException();
  }

  private async createInTransaction(
    context: AppointmentMutationContext,
    tenantId: string,
    dto: CreateAppointmentDto,
    currentUser: AuthenticatedUser,
    permissions: readonly Permission[],
  ) {
    const { customerId, professionalId, serviceId } = dto;
    if (!permissions.includes(PERMISSIONS.APPOINTMENT_CREATE_OTHERS)) {
      const ownProfessional = await this.professionalsService.findByUserId(tenantId, currentUser.id);
      if (ownProfessional.id !== professionalId) {
        throw new AppointmentOwnershipException();
      }
    }

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

    const appointment = await this.appointmentsRepository.create(
      {
        tenant: { connect: { id: tenantId } },
        professional: { connect: { id: professionalId } },
        service: { connect: { id: serviceId } },

        startsAt,
        endsAt,
        manageToken,
        status: AppointmentStatus.CONFIRMED,
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
      },
      context.tx,
    );

    if (customer) {
      context.afterCommit('appointment.created', {
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

  private async rescheduleInTransaction(
    context: AppointmentMutationContext,
    tenantId: string,
    id: string,
    currentUser: AuthenticatedUser,
    permissions: readonly Permission[],
    dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.appointmentsRepository.findById(tenantId, id, context.tx);

    if (!appointment) {
      throw new NotFoundException('No hemos encontrado la cita.');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED && appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Esta cita no puede ser reprogramada.');
    }

    const startsAt = parseISO(dto.startsAt);

    if (!isValid(startsAt)) {
      throw new BadRequestException('Formato de fecha inválido para startsAt.');
    }

    if (isEqual(startsAt, appointment.startsAt)) {
      throw new BadRequestException('El horario seleccionado es igual al que ya tiene la cita.');
    }

    const canRescheduleOthers = permissions.includes(PERMISSIONS.APPOINTMENT_RESCHEDULE_OTHERS);

    if (!canRescheduleOthers) {
      const professional = await this.professionalsService.findByUserId(tenantId, currentUser.id);

      if (professional.id !== appointment.professionalId) {
        throw new ForbiddenException('No tienes permisos para reprogramar citas de otros profesionales.');
      }
    }

    const isAvailable = await this.availabilityService.isSlotAvailable({
      tenantId,
      professionalId: appointment.professionalId,
      serviceId: appointment.serviceId,
      startsAt: dto.startsAt,
      ignoreMinAdvanced: true,
      allowPast: true,
      excludeAppointmentId: appointment.id,
    });

    if (!isAvailable) {
      throw new BadRequestException('El horario seleccionado ya no está disponible.');
    }

    const endsAt = addMinutes(startsAt, appointment.service.durationMinutes);

    const rescheduledAppointment = await this.appointmentsRepository.update(
      tenantId,
      id,
      {
        startsAt,
        endsAt,
        durationMinutes: appointment.service.durationMinutes,
        rescheduleReason: dto.rescheduleReason,
        rescheduleCount: { increment: 1 },
        blocks: {
          deleteMany: {},
          create: { startsAt, endsAt },
        },
      },
      context.tx,
    );

    if (appointment.customerId && appointment.customer) {
      context.afterCommit('appointment.rescheduled', {
        appointmentId: appointment.id,
        tenantId,
        userId: appointment.professional.userId,
        professionalId: appointment.professionalId,
        professionalName: appointment.professional.name,
        serviceId: appointment.serviceId,
        serviceName: appointment.service.name,
        customerId: appointment.customerId,
        customerName: appointment.customer.name,
        cancelUrl: `/appointments/${appointment.manageToken}/cancel`,
        rescheduleUrl: `/appointments/${appointment.manageToken}/reschedule`,
        detailsUrl: `${APP_URL}/appointments`,
        previousStartsAt: appointment.startsAt,
        previousEndsAt: appointment.endsAt,
        startsAt,
        endsAt,
        rescheduleReason: dto.rescheduleReason,
        rescheduledByName: currentUser.name,
        rescheduledBy: RecipientType.USER,
      } satisfies AppointmentRescheduledEvent);
    }

    return AppointmentsMapper.toResponse(rescheduledAppointment);
  }

  private async cancelInTransaction(
    context: AppointmentMutationContext,
    tenantId: string,
    id: string,
    currentUser: AuthenticatedUser,
    permissions: readonly Permission[],
    dto: CancelAppointmentDto = {},
  ) {
    const appointment = await this.appointmentsRepository.findById(tenantId, id, context.tx);

    if (!appointment) {
      throw new NotFoundException('No hemos encontrado la cita.');
    }

    if (!permissions.includes(PERMISSIONS.APPOINTMENT_CANCEL)) {
      throw new ForbiddenException('No tienes permisos para cancelar citas.');
    }

    if (!permissions.includes(PERMISSIONS.APPOINTMENT_CANCEL_OTHERS) && appointment.professional.userId !== currentUser.id) {
      throw new ForbiddenException('No tienes permisos para cancelar citas de otros profesionales.');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Una cita completada no puede ser cancelada.');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return AppointmentsMapper.toResponse(appointment);
    }

    const cancellationReason = dto.cancellationReason?.trim() || undefined;
    const cancelledAppointment = await this.appointmentsRepository.cancel(
      tenantId,
      id,
      {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason,
      },
      context.tx,
    );

    if (appointment.customerId && appointment.customer) {
      context.afterCommit('appointment.cancelled', {
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
        cancellationReason: cancellationReason ?? '',
        cancelledByName: currentUser.name,
        cancelledBy: RecipientType.USER,
      } satisfies AppointmentCancelledEvent);
    }

    return AppointmentsMapper.toResponse(cancelledAppointment);
  }
}
