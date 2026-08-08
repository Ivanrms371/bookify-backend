import { BadRequestException, Injectable } from '@nestjs/common';
import { ScheduleExceptionsRepository } from './schedule-exceptions.repository';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { ProfessionalsService } from '../../professionals.service';
import { ValidateHoursRangeParams, ValidateOverlapParams } from './types/schedule-exceptions.type';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { TenantProfessionalExceptionsParamsDto, TenantProfessionalParamsDto } from './dto/schedule-exceptions.params.dto';

@Injectable()
export class ScheduleExceptionsService {
  constructor(
    private readonly scheduleExceptionsRepository: ScheduleExceptionsRepository,
    private readonly professionalsService: ProfessionalsService,
  ) {}

  private validateHoursRange({ isClosed, blocks }: ValidateHoursRangeParams) {
    if (!isClosed && (!blocks || blocks.length === 0)) {
      throw new BadRequestException('');
    }
    if (!isClosed && blocks.some((block) => block.startAt > block.endAt)) {
      throw new BadRequestException('');
    }
  }

  private async validateOverlap({ professionalId, startDate, endDate, excludeId, daysOfWeek }: ValidateOverlapParams) {
    const existing = await this.scheduleExceptionsRepository.findByDateRange(professionalId, startDate, endDate, excludeId);

    const overlap = existing.some((ex) => !daysOfWeek || ex.daysOfWeek.some((d) => daysOfWeek.includes(d)));

    if (overlap) {
      throw new BadRequestException('Ya existe una excepción en el mismo rango de tiempo');
    }
  }

  async findAll(params: TenantProfessionalParamsDto) {
    return this.scheduleExceptionsRepository.findMany(params.professionalId, params.tenantId);
  }

  async create(params: TenantProfessionalParamsDto, body: CreateScheduleExceptionDto) {
    const professional = await this.professionalsService.findEntityOrFail(params.tenantId, params.professionalId);

    if (body.startDate > body.endDate) {
      throw new BadRequestException('La fecha de inicio debe ser menor a la fecha de fin');
    }

    this.validateHoursRange({
      isClosed: body.isClosed,
      blocks: body.blocks,
    });

    await this.validateOverlap({
      professionalId: professional.id,
      startDate: body.startDate,
      endDate: body.endDate,
      daysOfWeek: body.daysOfWeek,
    });

    await this.scheduleExceptionsRepository.create({
      tenant: { connect: { id: params.tenantId } },
      professional: { connect: { id: params.professionalId } },
      startDate: body.startDate,
      endDate: body.endDate,
      daysOfWeek: body.daysOfWeek,
      isClosed: body.isClosed,
      blocks: {
        create: body.blocks.map((block) => ({
          opensAt: timeToMinutes(block.startAt),
          closesAt: timeToMinutes(block.endAt),
        })),
      },
    });
  }

  async update(params: TenantProfessionalExceptionsParamsDto, body: UpdateScheduleExceptionDto) {}

  async delete(params: TenantProfessionalExceptionsParamsDto) {
    return this.scheduleExceptionsRepository.delete(params.exceptionId);
  }

  async findByDate(professionalId: string, date: Date) {
    return this.scheduleExceptionsRepository.findByDate(professionalId, date);
  }
}
