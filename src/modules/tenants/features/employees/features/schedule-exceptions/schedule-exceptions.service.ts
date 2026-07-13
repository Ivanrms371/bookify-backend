import { BadRequestException, Injectable } from '@nestjs/common';
import { ScheduleExceptionsRepository } from './schedule-exceptions.repository';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { EmployeesService } from '../../employees.service';
import { ValidateHoursRangeParams, ValidateOverlapParams } from './types/schedule-exceptions.type';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { TenantEmployeeExceptionsParamsDto, TenantEmployeeParamsDto } from './dto/schedule-exceptions.params.dto';

@Injectable()
export class ScheduleExceptionsService {
  constructor(
    private readonly scheduleExceptionsRepository: ScheduleExceptionsRepository,
    private readonly employeesService: EmployeesService,
  ) {}

  async findAllByEmployeeId(params: TenantEmployeeParamsDto) {
    return this.scheduleExceptionsRepository.findManyByEmployeeandTenant(params.employeeId, params.tenantId);
  }

  async createScheduleException(params: TenantEmployeeParamsDto, body: CreateScheduleExceptionDto) {
    const employee = await this.employeesService.validateEmployeeAndTenant(params.employeeId, params.tenantId);

    if (body.startDate > body.endDate) {
      throw new BadRequestException('La fecha de inicio debe ser menor a la fecha de fin');
    }
    this.validateHoursRange({
      isClosed: body.isClosed,
      blocks: body.blocks,
    });

    await this.validateOverlap({
      employeeId: employee.id,
      startDate: body.startDate,
      endDate: body.endDate,
      daysOfWeek: body.daysOfWeek,
    });

    await this.scheduleExceptionsRepository.create({
      tenant: { connect: { id: params.tenantId } },
      employee: { connect: { id: params.employeeId } },
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

  async updateScheduleException(params: TenantEmployeeExceptionsParamsDto, body: UpdateScheduleExceptionDto) {}

  async deleteScheduleException(params: TenantEmployeeExceptionsParamsDto) {
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

  async getExceptionsByEmployeeForDate(employeeId: string, date: Date) {
    return this.scheduleExceptionsRepository.findByEmployeeAndDate(employeeId, date);
  }

  //TODO: FIX THIS METHOD
  private async validateOverlap({ employeeId, startDate, endDate, excludeId, daysOfWeek }: ValidateOverlapParams) {
    const existing = await this.scheduleExceptionsRepository.findByEmployeeAndDateRange(employeeId, startDate, endDate, excludeId);

    const overlap = existing.some((ex) => !daysOfWeek || ex.daysOfWeek.some((d) => daysOfWeek.includes(d)));

    if (overlap) {
      throw new BadRequestException('Ya existe una excepción en el mismo rango de tiempo');
    }
  }
}
