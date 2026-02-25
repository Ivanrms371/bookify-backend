import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AvailabilityQuery } from 'src/shared/infrastructure/queries/availability.query';
import { AvailabilityData, Settings, Service } from './appointment-creation.type';

interface ValidateAvailabilityParams {
  staffId: string;
  serviceId: string;
  startTime: Date;
}

@Injectable()
export class AvailabilityPolicy {
  constructor(private readonly availabilityQuery: AvailabilityQuery) {}

  async validate(params: ValidateAvailabilityParams) {
    const { staffId, serviceId, startTime } = params;

    const availability = await this.availabilityQuery.getAvailabilityData(staffId, startTime);

    if (!availability) {
      throw new BadRequestException('El staff no tiene disponibilidad configurada');
    }

    const settings = availability.business.settings;
    if (!settings) {
      throw new BadRequestException('El negocio no tiene configuración');
    }

    const assignment = await this.availabilityQuery.findServiceAssignment(staffId, serviceId);

    if (!assignment) {
      throw new BadRequestException('El servicio no está asignado al staff');
    }

    const service = assignment.service;

    this.validateAdvancedTime(startTime, settings);

    const effectiveBlocks = this.resolveEffectiveBlocks(availability);

    this.validateWorkingHours(startTime, service.durationMinutes, effectiveBlocks);

    this.validateAppointmentsConflict(startTime, service, availability, settings);
  }

  private validateAdvancedTime(startTime: Date, settings: Settings) {
    const now = new Date();

    const minMinutes = settings.minAdvancedMinutes ?? 0;
    const maxDays = settings.maxAdvancedDays ?? 30;

    const diffMs = startTime.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMinutes < minMinutes) {
      throw new BadRequestException(`Debe reservar con al menos ${minMinutes} minutos de anticipación`);
    }

    if (diffDays > maxDays) {
      throw new BadRequestException(`No se puede reservar con más de ${maxDays} días de anticipación`);
    }
  }

  private resolveEffectiveBlocks(availability: AvailabilityData) {
    const exception = availability.exceptions?.[0];

    if (!exception) {
      return availability.workingHours;
    }

    if (exception.isClosed) {
      return [];
    }

    return exception.blocks;
  }

  private validateWorkingHours(startTime: Date, duration: number, blocks: { startMinutes: number; endMinutes: number }[]) {
    if (!blocks.length) {
      throw new BadRequestException('El negocio está cerrado en esa fecha');
    }

    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();

    const endMinutes = startMinutes + duration;

    const isValid = blocks.some((block) => startMinutes >= block.startMinutes && endMinutes <= block.endMinutes);

    if (!isValid) {
      throw new BadRequestException('El horario está fuera del horario laboral');
    }
  }

  private validateAppointmentsConflict(startTime: Date, service: Service, availability: AvailabilityData, settings: Settings) {
    const buffer = settings.bufferTimeMinutes ?? 0;

    const allowPassive = settings.allowPassiveTimeBooking ?? false;

    const serviceStart = startTime.getTime();
    const serviceEnd = serviceStart + service.durationMinutes * 60 * 1000;

    const adjustedStart = serviceStart - buffer * 60 * 1000;
    const adjustedEnd = serviceEnd + buffer * 60 * 1000;

    for (const appointment of availability.appointments) {
      const existingStart = new Date(appointment.startTime).getTime();
      const existingEnd = new Date(appointment.endTime).getTime();

      if (!allowPassive) {
        if (adjustedStart < existingEnd && adjustedEnd > existingStart) {
          throw new ConflictException('El horario ya está ocupado');
        }
      } else {
        // solo bloqueamos tiempo activo
        const activeEnd = existingStart + appointment.initialActiveMinutes * 60 * 1000 + appointment.finalActiveMinutes * 60 * 1000;

        if (adjustedStart < activeEnd && adjustedEnd > existingStart) {
          throw new ConflictException('El horario ya está ocupado');
        }
      }
    }
  }
}
