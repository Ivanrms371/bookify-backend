import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { UpdateWorkingHoursBulkDto } from './dto/update-working-hours-bulk.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateWorkingHoursBulkDto } from './dto/create-working-hour.dto';
import { TenantWorkingHoursRepository } from './tenant-working-hours.repository';
import { dayOfWeekToInt } from 'src/common/utils/day-of-week.util';
import { ValidateOverlapWorkingHoursInput } from './types/tenant-working-hours.type';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

interface ValidateOverlapParams {
  tenantId: string;
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
  excludeWorkingHourId?: string;
}

@Injectable()
export class TenantWorkingHoursService {
  constructor(
    private readonly workingHoursRepository: TenantWorkingHoursRepository,
    private readonly prisma: PrismaService,
  ) {}

  private validateOverlaps(workingHours: ValidateOverlapWorkingHoursInput[]) {
    const grouped = new Map<number, ValidateOverlapWorkingHoursInput[]>();

    for (const wh of workingHours) {
      const list = grouped.get(wh.dayOfWeek) ?? [];

      list.push(wh);

      grouped.set(wh.dayOfWeek, list);
    }

    for (const [_, intervals] of grouped) {
      intervals.sort((a, b) => a.opensAt - b.opensAt);

      for (let i = 0; i < intervals.length - 1; i++) {
        const current = intervals[i];
        const next = intervals[i + 1];

        const overlap = current.closesAt > next.opensAt;

        if (overlap) {
          throw new BadRequestException('Algunos horarios están superpuestos, por favor verifique.');
        }
      }
    }
  }

  async findAllByTenant(tenantId: string) {
    return this.workingHoursRepository.findManyByTenant(tenantId);
  }

  async create(tenantId: string, dto: CreateWorkingHoursBulkDto) {
    const workingHours = dto.workingHours.flatMap((wh) => {
      return wh.intervals.map((i) => {
        const dayOfWeek = dayOfWeekToInt(wh.dayOfWeek);
        const opensAt = timeToMinutes(i.opensAt);
        const closesAt = timeToMinutes(i.closesAt);

        return {
          tenantId,
          dayOfWeek,
          opensAt,
          closesAt,
        };
      });
    });

    this.validateOverlaps(workingHours);

    this.prisma.$transaction(async (tx) => {
      await this.workingHoursRepository.deleteMany(tenantId, tx);
      await this.workingHoursRepository.createMany({ data: workingHours }, tx);
    });
  }

  async delete(tenantId: string, workingHourId: string) {
    const workingHour = await this.workingHoursRepository.findById(workingHourId);
    if (!workingHour || workingHour.tenantId !== tenantId) {
      throw new NotFoundException('Horario no encontrado o no pertenece al negocio');
    }

    return await this.workingHoursRepository.delete(workingHourId);
  }

  async bulkUpdate(tenantId: string, dto: UpdateWorkingHoursBulkDto, tx?: TransactionClient) {
    const executeOperation = async (prismaClient: TransactionClient | PrismaService) => {
      if (dto.workingHours && dto.workingHours.length > 0) {
        const data = dto.workingHours.flatMap((wh) => {
          return wh.intervals.map((i) => {
            return {
              tenantId,
              dayOfWeek: dayOfWeekToInt(wh.dayOfWeek),
              opensAt: timeToMinutes(i.opensAt),
              closesAt: timeToMinutes(i.closesAt),
            };
          });
        });
        await this.workingHoursRepository.deleteMany(tenantId, prismaClient);
        await this.workingHoursRepository.createMany({ data }, prismaClient);
      }
      return { success: true };
    };

    if (tx) {
      return await executeOperation(tx);
    }

    return await this.prisma.$transaction(async (newTx) => {
      return await executeOperation(newTx);
    });
  }
}
