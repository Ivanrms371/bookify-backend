import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantWorkingHoursRepository } from './tenant-working-hours.repository';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { UpdateWorkingHoursBulkDto } from './dto/update-working-hours-bulk.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hours-bulk.dto';

interface ValidateOverlapParams {
  tenantId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  excludeWorkingHourId?: string;
}

@Injectable()
export class TenantWorkingHoursService {
  constructor(
    private readonly repository: TenantWorkingHoursRepository,
    private readonly prisma: PrismaService,
  ) {}

  private async validateOverlap({ dayOfWeek, endMinutes, tenantId, startMinutes, excludeWorkingHourId }: ValidateOverlapParams) {
    const existing = await this.repository.findByTenantAndDay(tenantId, dayOfWeek);

    const overlap = existing
      .filter((b) => !excludeWorkingHourId || b.id !== excludeWorkingHourId)
      .some((b) => startMinutes < b.endMinutes && endMinutes > b.startMinutes);

    if (overlap) {
      throw new BadRequestException('Ya existe un horario en el mismo rango de tiempo para el negocio');
    }
  }

  async findAllByTenant(tenantId: string) {
    return this.repository.findManyByTenant(tenantId);
  }

  async create(tenantId: string, dto: CreateWorkingHourDto) {
    const startMinutes = timeToMinutes(dto.startTime);
    const endMinutes = timeToMinutes(dto.endTime);

    await this.validateOverlap({
      tenantId,
      dayOfWeek: dto.dayOfWeek,
      startMinutes,
      endMinutes,
    });

    const workingHour = await this.repository.create({
      tenant: { connect: { id: tenantId } },
      dayOfWeek: dto.dayOfWeek,
      startMinutes,
      endMinutes,
    });
    return workingHour;
  }

  async update(tenantId: string, workingHourId: string, dto: UpdateWorkingHourDto) {
    const workingHour = await this.repository.findById(workingHourId);
    if (!workingHour || workingHour.tenantId !== tenantId) {
      throw new NotFoundException('Horario no encontrado o no pertenece al negocio');
    }

    const startMinutes = dto.startTime ? timeToMinutes(dto.startTime) : workingHour.startMinutes;
    const endMinutes = dto.endTime ? timeToMinutes(dto.endTime) : workingHour.endMinutes;
    const dayOfWeek = dto.dayOfWeek ?? workingHour.dayOfWeek;

    await this.validateOverlap({
      tenantId,
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

  async delete(tenantId: string, workingHourId: string) {
    const workingHour = await this.repository.findById(workingHourId);
    if (!workingHour || workingHour.tenantId !== tenantId) {
      throw new NotFoundException('Horario no encontrado o no pertenece al negocio');
    }

    return await this.repository.delete(workingHourId);
  }

  async bulkUpdate(tenantId: string, dto: UpdateWorkingHoursBulkDto) {
    return await this.prisma.$transaction(async (tx) => {
      // Borramos los actuales
      await tx.tenantWorkingHours.deleteMany({
        where: { tenantId },
      });

      // Insertamos los nuevos
      if (dto.workingHours && dto.workingHours.length > 0) {
        await tx.tenantWorkingHours.createMany({
          data: dto.workingHours.map((wh) => ({
            tenantId,
            dayOfWeek: wh.dayOfWeek,
            startMinutes: timeToMinutes(wh.startTime),
            endMinutes: timeToMinutes(wh.endTime),
            name: wh.name,
            isActive: true,
          })),
        });
      }

      // Aprovechamos y marcamos la bandera de onboarding si existe
      await tx.tenantOnboarding.updateMany({
        where: { tenantId },
        data: { hasSchedule: true },
      });

      return { success: true };
    });
  }
}
