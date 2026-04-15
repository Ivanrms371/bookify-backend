import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AvailabilityQuery } from 'src/shared/infrastructure/queries/availability.query';
import { AvailabilityData, Settings, Service } from './appointment-creation.type';
import { buildTimeBlocks } from '../appointment-block.builder';

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

    console.log(params);

    const availability = await this.availabilityQuery.getAvailabilityContextData(staffId, startTime);

    if (!availability) {
      throw new BadRequestException('El staff no tiene disponibilidad configurada');
    }

    const settings = availability.tenant.settings;
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

    this.validateWorkingHours(startTime, service, effectiveBlocks);

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

    console.log(availability.tenant.tenantWorkingHours);

    if (!exception) {
      if (availability.workingHours.length === 0) {
        return availability.tenant.tenantWorkingHours;
      }
      return availability.workingHours;
    }

    if (exception.isClosed) {
      return [];
    }

    return exception.blocks;
  }

  private validateWorkingHours(startTime: Date, service: Service, blocks: { startMinutes: number; endMinutes: number }[]) {
    if (!blocks.length) {
      throw new BadRequestException('El negocio está cerrado en esa fecha');
    }

    const newBlocks = buildTimeBlocks({
      startTime,
      initialActiveMinutes: service.initialActiveMinutes,
      passiveTimeMinutes: service.passiveTimeMinutes,
      finalActiveMinutes: service.finalActiveMinutes,
    });

    for (const newBlock of newBlocks) {
      const blockStartMins = newBlock.startTime.getHours() * 60 + newBlock.startTime.getMinutes();
      const blockEndMins = newBlock.endTime.getHours() * 60 + newBlock.endTime.getMinutes();

      const fitsInWorkingHours = blocks.some(
        (workingBlock) => blockStartMins >= workingBlock.startMinutes && blockEndMins <= workingBlock.endMinutes,
      );

      if (!fitsInWorkingHours) {
        throw new BadRequestException('El horario está fuera del horario laboral.');
      }
    }
  }

  private validateAppointmentsConflict(startTime: Date, service: Service, availability: AvailabilityData, settings: Settings) {
    const buffer = settings.bufferTimeMinutes ?? 0;

    const newBlocks = buildTimeBlocks({
      startTime,
      initialActiveMinutes: service.initialActiveMinutes,
      passiveTimeMinutes: service.passiveTimeMinutes,
      finalActiveMinutes: service.finalActiveMinutes,
    });

    for (const newBlock of newBlocks) {
      const adjustedStart = newBlock.startTime.getTime() - buffer * 60 * 1000;
      const adjustedEnd = newBlock.endTime.getTime() + buffer * 60 * 1000;

      for (const appointment of availability.appointments) {
        for (const existingBlock of appointment.blocks) {
          const blockStart = new Date(existingBlock.startTime).getTime();
          const blockEnd = new Date(existingBlock.endTime).getTime();

          if (adjustedStart < blockEnd && adjustedEnd > blockStart) {
            throw new ConflictException('El horario ya está ocupado');
          }
        }
      }
    }
  }
}
