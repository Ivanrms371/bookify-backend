import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantWorkingHoursRepository } from './tenant-working-hours.repository';
import { UpdateTenantWorkingHoursDto } from '../dto/update-tenant-working-hours.dto';
import { dayOfWeekToInt } from 'src/common/utils/day-of-week.util';
import { timeToMinutes } from 'src/common/utils/time.util';
import { formatWorkingHoursForFrontend } from 'src/shared/schedule';

@Injectable()
export class TenantWorkingHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: TenantWorkingHoursRepository,
  ) {}

  async findAll(tenantId: string) {
    const rawHours = await this.repository.findAll(tenantId);
    return formatWorkingHoursForFrontend(rawHours);
  }

  async replace(tenantId: string, dto: UpdateTenantWorkingHoursDto): Promise<{ success: boolean }> {
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

    await this.prisma.$transaction(async (tx) => {
      await this.repository.replaceWorkingHours(tenantId, workingHours, tx);
    });

    return { success: true };
  }
}
