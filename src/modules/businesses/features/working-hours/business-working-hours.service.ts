import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessWorkingHoursRepository } from './business-working-hours.repository';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { CreateWorkingHourDto } from 'src/modules/staffs/features/working-hours/dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from 'src/modules/staffs/features/working-hours/dto/update-working-hour.dto';
import { UpdateWorkingHoursBulkDto } from './dto/update-working-hours-bulk.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';

interface ValidateOverlapParams {
  businessId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  excludeWorkingHourId?: string;
}

@Injectable()
export class BusinessWorkingHoursService {
  constructor(
    private readonly repository: BusinessWorkingHoursRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async validateOverlap({ dayOfWeek, endMinutes, businessId, startMinutes, excludeWorkingHourId }: ValidateOverlapParams) {
    const existing = await this.repository.findByBusinessAndDay(businessId, dayOfWeek);

    const overlap = existing
      .filter((b) => !excludeWorkingHourId || b.id !== excludeWorkingHourId)
      .some((b) => startMinutes < b.endMinutes && endMinutes > b.startMinutes);

    if (overlap) {
      throw new BadRequestException('Ya existe un horario en el mismo rango de tiempo para el negocio');
    }
  }

  async findAllByBusiness(businessId: string) {
    return this.repository.findManyByBusiness(businessId);
  }

  async create(businessId: string, dto: CreateWorkingHourDto) {
    const startMinutes = timeToMinutes(dto.startTime);
    const endMinutes = timeToMinutes(dto.endTime);

    await this.validateOverlap({
      businessId,
      dayOfWeek: dto.dayOfWeek,
      startMinutes,
      endMinutes,
    });

    const workingHour = await this.repository.create({
      business: { connect: { id: businessId } },
      dayOfWeek: dto.dayOfWeek,
      startMinutes,
      endMinutes,
    });
    return workingHour;
  }

  async update(businessId: string, workingHourId: string, dto: UpdateWorkingHourDto) {
    const workingHour = await this.repository.findById(workingHourId);
    if (!workingHour || workingHour.businessId !== businessId) {
      throw new NotFoundException('Horario no encontrado o no pertenece al negocio');
    }

    const startMinutes = dto.startTime ? timeToMinutes(dto.startTime) : workingHour.startMinutes;
    const endMinutes = dto.endTime ? timeToMinutes(dto.endTime) : workingHour.endMinutes;
    const dayOfWeek = dto.dayOfWeek ?? workingHour.dayOfWeek;

    await this.validateOverlap({
      businessId,
      dayOfWeek,
      startMinutes,
      endMinutes,
      excludeWorkingHourId: workingHourId,
    });

    return await this.repository.update(workingHourId, {
      dayOfWeek,
      startMinutes,
      endMinutes,
    });
  }

  async delete(businessId: string, workingHourId: string) {
    const workingHour = await this.repository.findById(workingHourId);
    if (!workingHour || workingHour.businessId !== businessId) {
      throw new NotFoundException('Horario no encontrado o no pertenece al negocio');
    }

    return await this.repository.delete(workingHourId);
  }

  async bulkUpdate(businessId: string, dto: UpdateWorkingHoursBulkDto) {
    return await this.prisma.$transaction(async (tx) => {
      // Borramos los actuales
      await tx.businessWorkingHours.deleteMany({
        where: { businessId },
      });

      // Insertamos los nuevos
      if (dto.workingHours && dto.workingHours.length > 0) {
        await tx.businessWorkingHours.createMany({
          data: dto.workingHours.map((wh) => ({
            businessId,
            dayOfWeek: wh.dayOfWeek,
            startMinutes: timeToMinutes(wh.startTime),
            endMinutes: timeToMinutes(wh.endTime),
            name: wh.name,
            isActive: true,
          })),
        });
      }

      // Aprovechamos y marcamos la bandera de onboarding si existe
      await tx.businessOnboarding.updateMany({
        where: { businessId },
        data: { hasSchedule: true },
      });

      return { success: true };
    });
  }
}
