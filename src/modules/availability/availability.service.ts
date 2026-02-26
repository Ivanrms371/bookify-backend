import { BadRequestException, Injectable } from '@nestjs/common';
import { ResolvedSchedule, ResolveScheduleParams } from './types/availability.type';
import { endOfDay, getDay, startOfDay } from 'date-fns';
import { SlotsGenerator } from './slots.generator';
import { AvailabilityQuery } from 'src/shared/infrastructure/queries/availability.query';
import { FetchedAppointmentBlock } from './types/slots.type';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly slotsGenerator: SlotsGenerator,
    private readonly availability: AvailabilityQuery,
  ) {}

  async getAvailability(staffId: string, date: Date) {
    const availabilityData = await this.availability.getAvailabilityData(staffId, date);

    if (!availabilityData) {
      throw new BadRequestException('No se encontro disponibilidad para la fecha');
    }

    return availabilityData;
  }

  async getSlotsAvailability(staffId: string, serviceId: string, date: Date) {
    const availabilityData = await this.getAvailability(staffId, date);

    const settings = availabilityData.business.settings;
    if (!settings) {
      throw new BadRequestException('No se encontro disponibilidad para la fecha');
    }

    const assignment = await this.availability.findServiceAssignment(staffId, serviceId);
    if (!assignment) {
      throw new BadRequestException('No se encontro el servicio');
    }

    const slotInterval = availabilityData.slotIntervalMinutes || settings.slotIntervalMinutes;
    const serviceDuration = assignment.service.durationMinutes;
    const minAdvancedMinutes = availabilityData.minAdvancedMinutes || settings.minAdvancedMinutes;

    const appointmentBlocks: FetchedAppointmentBlock[] = availabilityData.appointments.flatMap((appointment) => appointment.blocks);

    const blocks = this.resolveSchedule({
      workingBlocks: availabilityData.workingHours,
      scheduleException: availabilityData.exceptions[0],
    });

    const slots = this.slotsGenerator.generate({
      strategy: 'dynamic',
      interval: slotInterval,
      blocks,
      serviceDuration,
      appointmentBlocks,
      date,
      minAdvancedMinutes,
    });

    return slots;
  }

  private resolveSchedule({ workingBlocks, scheduleException }: ResolveScheduleParams): ResolvedSchedule[] {
    if (!scheduleException) return workingBlocks;

    if (scheduleException.isClosed) return [];

    return scheduleException.blocks;
  }
}
