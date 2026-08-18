import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ScheduleExceptionRepository } from '../repositories/schedule-exception.repository';
import { CreateScheduleExceptionDto } from '../dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from '../dto/update-schedule-exception.dto';
import { isAfter } from 'date-fns';
import { mapTimeIntervals } from '../mappers/map-time-interval.mapper';
import { dayOfWeekToInt } from 'src/common/utils/day-of-week.util';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { toScheduleExceptionResponse } from '../mappers/schedule-exception.mapper';

@Injectable()
export class ScheduleExceptionService {
  constructor(private readonly scheduleExceptionRepository: ScheduleExceptionRepository) {}

  async findAll(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = await this.scheduleExceptionRepository.findMany(tenantId, { startDate: today });
    return rows.map(toScheduleExceptionResponse);
  }

  async findById(tenantId: string, id: string) {
    const exception = await this.scheduleExceptionRepository.findById(tenantId, id);
    if (!exception) {
      throw new NotFoundException('Excepción de horario no encontrada');
    }
    return toScheduleExceptionResponse(exception);
  }

  async create(tenantId: string, dto: CreateScheduleExceptionDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const { isClosed, professionalIds, reason } = dto;

    if (isAfter(startDate, endDate)) {
      throw new BadRequestException('La fecha de inicio debe ser anterior o igual a la fecha de fin');
    }

    if (!isClosed && (!dto.intervals || dto.intervals.length === 0)) {
      throw new BadRequestException('Debes definir al menos un intervalo de trabajo cuando el negocio no está cerrado');
    }

    const intervals = isClosed ? [] : mapTimeIntervals(dto.intervals!);
    const professionals = professionalIds.map((p) => ({ professionalId: p }));

    const raw = await this.scheduleExceptionRepository.create({
      tenant: { connect: { id: tenantId } },
      blocks: { createMany: { data: intervals } },
      professionals: { createMany: { data: professionals } },
      startDate,
      endDate,
      isClosed,
      reason,
    });
    return toScheduleExceptionResponse(raw);
  }

  async update(tenantId: string, id: string, dto: UpdateScheduleExceptionDto) {
    await this.findById(tenantId, id);

    const { isClosed, professionalIds, reason } = dto;
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    if (startDate && endDate && isAfter(startDate, endDate)) {
      throw new BadRequestException('La fecha de inicio debe ser anterior o igual a la fecha de fin');
    }

    const intervals = isClosed ? [] : dto.intervals ? mapTimeIntervals(dto.intervals) : [];
    const professionals = professionalIds ? professionalIds.map((p) => ({ professionalId: p })) : [];

    const raw = await this.scheduleExceptionRepository.update(tenantId, id, {
      blocks: {
        deleteMany: {},
        createMany: { data: intervals },
      },
      professionals: {
        deleteMany: {},
        createMany: { data: professionals },
      },
      startDate,
      endDate,
      isClosed,
      reason,
    });

    return toScheduleExceptionResponse(raw);
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.scheduleExceptionRepository.delete(tenantId, id);
  }
}
