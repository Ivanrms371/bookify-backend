import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkingHoursRepository } from './working-hours.repository';
import { BusinessStaffParamsDto, BusinessStaffWorkingHoursParamsDto } from '../../dto/params.dto';
import { StaffsService } from '../../staffs.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { ValidateOverlapParams } from './types/validate-overlap.type';
import { getDay } from 'date-fns';

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly staffsService: StaffsService,
    private readonly workingHoursRepository: WorkingHoursRepository,
  ) {}

  private async validateOverlap({
    dayOfWeek,
    endMinutes,
    staffId,
    startMinutes,
    excludeWorkingHourId,
  }: ValidateOverlapParams) {
    const existing = await this.workingHoursRepository.findByStaffAndDay(staffId, dayOfWeek);

    const overlap = existing
      .filter((b) => !excludeWorkingHourId || b.id !== excludeWorkingHourId)
      .some((b) => startMinutes < b.endMinutes && endMinutes > b.startMinutes);

    if (overlap) {
      throw new BadRequestException('Ya existe un horario en el mismo rango de tiempo');
    }
  }

  async findAllWorkingHoursByStaff(params: BusinessStaffParamsDto) {
    const staff = await this.staffsService.validateStaffAndBusiness(
      params.staffId,
      params.businessId,
    );

    const workingHours = await this.workingHoursRepository.findManyByStaff(staff.id);
    return workingHours;
  }

  async createWorkingHour(params: BusinessStaffParamsDto, dto: CreateWorkingHourDto) {
    const staff = await this.staffsService.validateStaffAndBusiness(
      params.staffId,
      params.businessId,
    );

    const startMinutes = timeToMinutes(dto.startTime);
    const endMinutes = timeToMinutes(dto.endTime);

    await this.validateOverlap({
      staffId: staff.id,
      dayOfWeek: dto.dayOfWeek,
      startMinutes,
      endMinutes,
    });

    const workingHour = await this.workingHoursRepository.create({
      business: { connect: { id: params.businessId } },
      staff: { connect: { id: staff.id } },
      dayOfWeek: dto.dayOfWeek,
      startMinutes,
      endMinutes,
    });
    return workingHour;
  }

  async updateWorkingHour(params: BusinessStaffWorkingHoursParamsDto, dto: UpdateWorkingHourDto) {
    const staff = await this.staffsService.validateStaffAndBusiness(
      params.staffId,
      params.businessId,
    );

    const workingHour = await this.workingHoursRepository.findById(params.workingHourId);
    if (!workingHour || workingHour.staffId !== staff.id) {
      throw new NotFoundException('Horario no encontrado');
    }

    const startMinutes = dto.startTime ? timeToMinutes(dto.startTime) : workingHour.startMinutes;
    const endMinutes = dto.endTime ? timeToMinutes(dto.endTime) : workingHour.endMinutes;
    const dayOfWeek = dto.dayOfWeek ?? workingHour.dayOfWeek;

    await this.validateOverlap({
      staffId: staff.id,
      dayOfWeek,
      startMinutes,
      endMinutes,
      excludeWorkingHourId: params.workingHourId,
    });

    return await this.workingHoursRepository.update(params.workingHourId, {
      dayOfWeek,
      startMinutes,
      endMinutes,
    });
  }

  async deleteWorkingHour(params: BusinessStaffWorkingHoursParamsDto) {
    const staff = await this.staffsService.validateStaffAndBusiness(
      params.staffId,
      params.businessId,
    );

    const workingHour = await this.workingHoursRepository.findById(params.workingHourId);
    if (!workingHour || workingHour.staffId !== staff.id) {
      throw new NotFoundException('Horario no encontrado');
    }

    return await this.workingHoursRepository.delete(params.workingHourId);
  }

  async getWorkingBlocks(staffId: string, date: Date) {
    const dayOfWeek = getDay(date);
    return await this.workingHoursRepository.findStaffWorkingHoursForSlots(staffId, dayOfWeek);
  }
}
