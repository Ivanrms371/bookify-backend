import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkingHoursRepository } from './working-hours.repository';
import { EmployeesService } from '../../employees.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { ValidateOverlapParams } from './types/validate-overlap.type';
import { getDay } from 'date-fns';
import { TenantEmployeeParamsDto, TenantEmployeeWorkingHoursParamsDto } from './dto/working-hours.params.dto';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly staffsService: EmployeesService,
    private readonly workingHoursRepository: WorkingHoursRepository,
  ) {}

  private async validateOverlap({ dayOfWeek, closesAt, employeeId, opensAt, excludeWorkingHourId }: ValidateOverlapParams) {
    const existing = await this.workingHoursRepository.findByEmployeeAndDay(employeeId, dayOfWeek);

    const overlap = existing
      .filter((b) => !excludeWorkingHourId || b.id !== excludeWorkingHourId)
      .some((b) => opensAt < b.closesAt && closesAt > b.opensAt);

    if (overlap) {
      throw new BadRequestException('Ya existe un horario en el mismo rango de tiempo');
    }
  }

  async findAllWorkingHoursByEmployee(params: TenantEmployeeParamsDto) {
    const staff = await this.staffsService.validateEmployeeAndTenant(params.employeeId, params.tenantId);

    const workingHours = await this.workingHoursRepository.findManyByEmployee(staff.id);
    return workingHours;
  }

  async createWorkingHour(params: TenantEmployeeParamsDto, dto: CreateWorkingHourDto) {
    const staff = await this.staffsService.validateEmployeeAndTenant(params.employeeId, params.tenantId);

    const opensAt = timeToMinutes(dto.startTime);
    const closesAt = timeToMinutes(dto.endTime);

    await this.validateOverlap({
      employeeId: staff.id,
      dayOfWeek: dto.dayOfWeek,
      opensAt,
      closesAt,
    });

    const workingHour = await this.workingHoursRepository.create({
      tenant: { connect: { id: params.tenantId } },
      employee: { connect: { id: staff.id } },
      dayOfWeek: dto.dayOfWeek,
      opensAt,
      closesAt,
    });
    return workingHour;
  }

  async updateWorkingHour(params: TenantEmployeeWorkingHoursParamsDto, dto: UpdateWorkingHourDto) {
    const staff = await this.staffsService.validateEmployeeAndTenant(params.employeeId, params.tenantId);

    const workingHour = await this.workingHoursRepository.findById(params.workingHourId);
    if (!workingHour || workingHour.employeeId !== staff.id) {
      throw new NotFoundException('Horario no encontrado');
    }

    const opensAt = dto.startTime ? timeToMinutes(dto.startTime) : workingHour.opensAt;
    const closesAt = dto.endTime ? timeToMinutes(dto.endTime) : workingHour.closesAt;
    const dayOfWeek = dto.dayOfWeek ?? workingHour.dayOfWeek;

    await this.validateOverlap({
      employeeId: staff.id,
      dayOfWeek,
      opensAt,
      closesAt,
      excludeWorkingHourId: params.workingHourId,
    });

    return await this.workingHoursRepository.update(params.workingHourId, {
      dayOfWeek,
      opensAt,
      closesAt,
    });
  }

  async deleteWorkingHour(params: TenantEmployeeWorkingHoursParamsDto) {
    const staff = await this.staffsService.validateEmployeeAndTenant(params.employeeId, params.tenantId);

    const workingHour = await this.workingHoursRepository.findById(params.workingHourId);
    if (!workingHour || workingHour.employeeId !== staff.id) {
      throw new NotFoundException('Horario no encontrado');
    }

    return await this.workingHoursRepository.delete(params.workingHourId);
  }

  async getWorkingBlocks(employeeId: string, date: Date) {
    const dayOfWeek = getDay(date);
    return await this.workingHoursRepository.findEmployeeWorkingHoursForSlots(employeeId, dayOfWeek);
  }

  async assignWorkingHours(
    employeeId: string,
    tenantId: string,
    blocks: Array<{ dayOfWeek: number; opensAt: number; closesAt: number; isActive: boolean; name?: string }>,
    tx?: any,
  ) {
    if (!blocks || blocks.length === 0) return;

    await this.workingHoursRepository.deleteByEmployeeId(employeeId, tenantId, tx);

    const dataToCreate = blocks.map((wh) => ({
      tenantId,
      employeeId,
      dayOfWeek: wh.dayOfWeek,
      opensAt: wh.opensAt,
      closesAt: wh.closesAt,
      isActive: wh.isActive,
      name: wh.name || undefined,
    }));

    await this.workingHoursRepository.createMany(dataToCreate as any, tx);
  }
}
