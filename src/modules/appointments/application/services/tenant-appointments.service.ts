import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentsRepository } from '../../infrastructure/appointments.repository';
import { AppointmentMapper } from '../mappers/appointment.mapper';
import { FindTenantAppointmentsFilters } from '../../domain/appointment.types';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { AppointmentStatsService } from './appointment-stats.service';
import { CancelAppointmentDto } from '../../dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from '../../dto/reschedule-appointment.dto';
import EventEmitter2 from 'eventemitter2';
import { AppointmentCancelledByStaffEvent } from '../../domain/events/appointment-cancelled.event';
import { GetAppointmentsQueryDto } from '../../dto/appointment-query.dto';
import { differenceInDays } from 'date-fns';
import { ServicesService } from 'src/modules/tenants/features/services/services/services.service';
import { buildTimeBlocks } from '../../domain/appointment-block.builder';

@Injectable()
export class TenantAppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly appointmentStatsService: AppointmentStatsService,
    private readonly servicesService: ServicesService,
  ) {}

  private readonly maxDateRange = 31;

  async findAllByTenant(tenantId: string, params: GetAppointmentsQueryDto) {
    const startDate = params.startDate ?? new Date();
    const endDate = params.endDate ?? new Date();
    const daysBetween = differenceInDays(endDate, startDate);

    if (daysBetween > this.maxDateRange) {
      throw new BadRequestException(`Date range cannot exceed ${this.maxDateRange} days`);
    }

    const appointments = await this.appointmentsRepository.findManyByTenant({
      ...params,
      tenantId,
      startDate,
      endDate,
    });
    return appointments.map(AppointmentMapper.toCalendarEvent);
  }

  async findByIdForTenant(tenantId: string, appointmentId: string) {
    const appointment = await this.appointmentsRepository.findByIdForTenant(tenantId, appointmentId);
    if (!appointment) throw new NotFoundException('Appointment not found');
    return AppointmentMapper.toDetail(appointment);
  }

  async markAsNoShow(tenantId: string, appointmentId: string) {
    const appointment = await this.appointmentsRepository.findByIdForTenant(tenantId, appointmentId);

    if (!appointment) throw new NotFoundException('No hemos encontrado la cita');

    if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
      throw new BadRequestException('No es posible cambiar de estado esta notificación.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.appointmentsRepository.markAsNoShow(appointmentId, tx);

      await this.appointmentStatsService.onNoShow(
        {
          customerId: appointment.customerId,
          staffId: appointment.staff.id,
          startTime: appointment.startTime,
          previousStatus: appointment.status,
          revenue: appointment.price,
          tenantId,
        },
        tx,
      );
    });
  }

  async markAsCancelled(tenantId: string, appointmentId: string, dto: CancelAppointmentDto) {
    const appointment = await this.appointmentsRepository.findByIdForTenant(tenantId, appointmentId);

    if (!appointment) throw new NotFoundException('No hemos encontrado la cita');

    if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
      throw new BadRequestException('No es posible cambiar de estado esta notificación.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.appointmentsRepository.markAsCancelled(appointmentId, dto.reason, tx);

      await this.appointmentStatsService.onCancelled(
        {
          customerId: appointment.customerId,
          staffId: appointment.staff.id,
          startTime: appointment.startTime,
          isCustomerFault: false,
          tenantId,
          previousStatus: appointment.status,
          revenue: appointment.price,
        },
        tx,
      );
    });

    this.eventEmitter.emit('appointment.cancelled.by_staff', {
      appointmentId,
      reason: dto.reason,
      staffName: appointment.staff.displayName,
      customerName: appointment.customerName,
      startTime: appointment.startTime,
    } as AppointmentCancelledByStaffEvent);
  }

  async reschedule(tenantId: string, appointmentId: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.appointmentsRepository.findByIdForTenant(tenantId, appointmentId);

    if (!appointment) throw new NotFoundException('No hemos encontrado la cita');

    if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
      throw new BadRequestException('No es posible reagendar una cita cancelada o marcada como no asistió.');
    }

    const service = await this.servicesService.findServiceById(dto.serviceId, dto.staffId);
    const startTime = new Date(dto.date);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    const timeBlocks = buildTimeBlocks({
      startTime,
      initialActiveMinutes: service.initialActiveMinutes,
      passiveTimeMinutes: service.passiveTimeMinutes,
      finalActiveMinutes: service.finalActiveMinutes,
    });

    const blocks = timeBlocks.map((block) => ({
      staffId: dto.staffId,
      startTime: block.startTime,
      endTime: block.endTime,
    }));

    await this.appointmentsRepository.reschedule(
      appointmentId,
      {
        staffId: dto.staffId,
        serviceId: dto.serviceId,
        startTime,
        endTime,
        durationMinutes: service.durationMinutes,
        initialActiveMinutes: service.initialActiveMinutes,
        passiveMinutes: service.passiveTimeMinutes,
        finalActiveMinutes: service.finalActiveMinutes,
        price: service.price,
        discountFixed: service.discountFixed,
        discountPercentage: service.discountPercentage,
        rescheduleReason: dto.reason,
      },
      blocks,
    );
  }
}

