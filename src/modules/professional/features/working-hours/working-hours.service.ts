import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkingHoursRepository } from './working-hours.repository';
import { ProfessionalsService } from '../../professionals.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { ValidateOverlapParams } from './types/validate-overlap.type';
import { getDay } from 'date-fns';
import { TenantProfessionalParamsDto, TenantProfessionalWorkingHoursParamsDto } from './dto/working-hours.params.dto';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly professionalsService: ProfessionalsService,
    private readonly workingHoursRepository: WorkingHoursRepository,
  ) {}

  private async validateOverlap({ dayOfWeek, closesAt, professionalId, opensAt, excludeWorkingHourId }: ValidateOverlapParams) {
    const existing = await this.workingHoursRepository.findByProfessionalAndDay(professionalId, dayOfWeek);

    const overlap = existing
      .filter((b) => !excludeWorkingHourId || b.id !== excludeWorkingHourId)
      .some((b) => opensAt < b.closesAt && closesAt > b.opensAt);

    if (overlap) {
      throw new BadRequestException('Ya existe un horario en el mismo rango de tiempo');
    }
  }

  async findAll(params: TenantProfessionalParamsDto) {
    const staff = await this.professionalsService.findEntityOrFail(params.tenantId, params.professionalId);

    const workingHours = await this.workingHoursRepository.findMany(staff.id);
    return workingHours;
  }

  async create(params: TenantProfessionalParamsDto, dto: CreateWorkingHourDto) {
    const staff = await this.professionalsService.findEntityOrFail(params.tenantId, params.professionalId);

    const opensAt = timeToMinutes(dto.startsAt);
    const closesAt = timeToMinutes(dto.endsAt);

    await this.validateOverlap({
      professionalId: staff.id,
      dayOfWeek: dto.dayOfWeek,
      opensAt,
      closesAt,
    });

    const workingHour = await this.workingHoursRepository.create({
      tenant: { connect: { id: params.tenantId } },
      professional: { connect: { id: staff.id } },
      dayOfWeek: dto.dayOfWeek,
      opensAt,
      closesAt,
    });
    return workingHour;
  }

  async update(params: TenantProfessionalWorkingHoursParamsDto, dto: UpdateWorkingHourDto) {
    const staff = await this.professionalsService.findEntityOrFail(params.tenantId, params.professionalId);

    const workingHour = await this.workingHoursRepository.findById(params.workingHourId);
    if (!workingHour || workingHour.professionalId !== staff.id) {
      throw new NotFoundException('Horario no encontrado');
    }

    const opensAt = dto.startsAt ? timeToMinutes(dto.startsAt) : workingHour.opensAt;
    const closesAt = dto.endsAt ? timeToMinutes(dto.endsAt) : workingHour.closesAt;
    const dayOfWeek = dto.dayOfWeek ?? workingHour.dayOfWeek;

    await this.validateOverlap({
      professionalId: staff.id,
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

  async delete(params: TenantProfessionalWorkingHoursParamsDto) {
    const staff = await this.professionalsService.findEntityOrFail(params.tenantId, params.professionalId);

    const workingHour = await this.workingHoursRepository.findById(params.workingHourId);
    if (!workingHour || workingHour.professionalId !== staff.id) {
      throw new NotFoundException('Horario no encontrado');
    }

    return await this.workingHoursRepository.delete(params.workingHourId);
  }

  async getWorkingBlocks(professionalId: string, date: Date) {
    const dayOfWeek = getDay(date);
    return await this.workingHoursRepository.findForSlots(professionalId, dayOfWeek);
  }

  async assign(
    professionalId: string,
    tenantId: string,
    blocks: Array<{ dayOfWeek: number; opensAt: number; closesAt: number; isActive: boolean; name?: string }>,
    tx?: any,
  ) {
    if (!blocks || blocks.length === 0) return;

    await this.workingHoursRepository.deleteByProfessionalId(professionalId, tenantId, tx);

    const dataToCreate = blocks.map((wh) => ({
      tenantId,
      professionalId,
      dayOfWeek: wh.dayOfWeek,
      opensAt: wh.opensAt,
      closesAt: wh.closesAt,
      isActive: wh.isActive,
      name: wh.name || undefined,
    }));

    await this.workingHoursRepository.createMany(dataToCreate as any, tx);
  }
}
