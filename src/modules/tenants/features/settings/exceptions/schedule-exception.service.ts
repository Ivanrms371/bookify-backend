import { Injectable, NotFoundException } from '@nestjs/common';
import { ScheduleExceptionRepository } from './schedule-exception.repository';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { mapTimeIntervals } from 'src/shared/schedule/map-time-interval.mapper';
import { toScheduleExceptionResponse } from './mappers/schedule-exception.mapper';
import { validateException } from './utils/validate-exception';
import { InvalidScheduleException } from './exceptions/invalid-schedule-exception.exception';

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
    validateException(dto);
    await this.verifyProfessionalOwnership(tenantId, dto.professionalIds);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const { isClosed, professionalIds, reason } = dto;

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
    validateException(dto);
    await this.verifyProfessionalOwnership(tenantId, dto.professionalIds);

    const { isClosed, professionalIds, reason } = dto;
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

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

  private async verifyProfessionalOwnership(tenantId: string, professionalIds: string[]) {
    const count = await this.scheduleExceptionRepository.countTenantProfessionals(tenantId, professionalIds);
    if (count !== professionalIds.length)
      throw new InvalidScheduleException('Los profesionales deben pertenecer a este negocio y no estar eliminados');
  }
}
