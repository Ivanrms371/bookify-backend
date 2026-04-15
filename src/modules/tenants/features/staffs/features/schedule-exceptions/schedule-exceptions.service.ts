import { BadRequestException, Injectable } from '@nestjs/common';
import { ScheduleExceptionsRepository } from './schedule-exceptions.repository';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { StaffsService } from '../../staffs.service';
import { ValidateHoursRangeParams, ValidateOverlapParams } from './types/schedule-exceptions.type';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { TenantStaffExceptionsParamsDto, TenantStaffParamsDto } from './dto/schedule-exceptions.params.dto';

@Injectable()
export class ScheduleExceptionsService {
  constructor(
    private readonly scheduleExceptionsRepository: ScheduleExceptionsRepository,
    private readonly staffsService: StaffsService,
  ) {}

  async findAllByStaffId(params: TenantStaffParamsDto) {
    return this.scheduleExceptionsRepository.findManyByStaffandTenant(params.staffId, params.tenantId);
  }

  async createScheduleException(params: TenantStaffParamsDto, body: CreateScheduleExceptionDto) {
    const staff = await this.staffsService.validateStaffAndTenant(params.staffId, params.tenantId);

    if (body.startDate > body.endDate) {
      throw new BadRequestException('La fecha de inicio debe ser menor a la fecha de fin');
    }
    this.validateHoursRange({
      isClosed: body.isClosed,
      blocks: body.blocks,
    });

    await this.validateOverlap({
      staffId: staff.id,
      startDate: body.startDate,
      endDate: body.endDate,
      daysOfWeek: body.daysOfWeek,
    });

    await this.scheduleExceptionsRepository.create({
      tenant: { connect: { id: params.tenantId } },
      staff: { connect: { id: params.staffId } },
      startDate: body.startDate,
      endDate: body.endDate,
      daysOfWeek: body.daysOfWeek,
      isClosed: body.isClosed,
      blocks: {
        create: body.blocks.map((block) => ({
          startMinutes: timeToMinutes(block.startAt),
          endMinutes: timeToMinutes(block.endAt),
        })),
      },
    });
  }

  async updateScheduleException(params: TenantStaffExceptionsParamsDto, body: UpdateScheduleExceptionDto) {}

  async deleteScheduleException(params: TenantStaffExceptionsParamsDto) {
    return this.scheduleExceptionsRepository.delete(params.exceptionId);
  }

  private validateHoursRange({ isClosed, blocks }: ValidateHoursRangeParams) {
    if (!isClosed && (!blocks || blocks.length === 0)) {
      throw new BadRequestException('');
    }
    if (!isClosed && blocks.some((block) => block.startAt > block.endAt)) {
      throw new BadRequestException('');
    }
  }

  async getExceptionsByStaffForDate(staffId: string, date: Date) {
    return this.scheduleExceptionsRepository.findByStaffAndDate(staffId, date);
  }

  //TODO: FIX THIS METHOD
  private async validateOverlap({ staffId, startDate, endDate, excludeId, daysOfWeek }: ValidateOverlapParams) {
    const existing = await this.scheduleExceptionsRepository.findByStaffAndDateRange(staffId, startDate, endDate, excludeId);

    const overlap = existing.some((ex) => !daysOfWeek || ex.daysOfWeek.some((d) => daysOfWeek.includes(d)));

    if (overlap) {
      throw new BadRequestException('Ya existe una excepción en el mismo rango de tiempo');
    }
  }
}
