import { BadRequestException, Injectable } from '@nestjs/common';
import { ProfessionalWorkingHoursRepository } from './working-hours.repository';
import { dayOfWeekToInt } from 'src/common/utils/day-of-week.util';
import { timeToMinutes } from 'src/common/utils/time/time.util';
import { validateOverlaps } from 'src/common/utils/validate-overlap';
import { CreateWorkingHoursBulkDto } from './dto/create-working-hour.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

@Injectable()
export class ProfessionalWorkingHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workingHoursRepository: ProfessionalWorkingHoursRepository,
  ) {}

  async replaceAll(tenantId: string, professionalId: string, dto: CreateWorkingHoursBulkDto, tx?: TransactionClient) {
    const workingHours = dto.workingHours.flatMap((wh) => {
      return wh.intervals.map((i) => {
        const dayOfWeek = dayOfWeekToInt(wh.dayOfWeek);
        const opensAt = timeToMinutes(i.opensAt);
        const closesAt = timeToMinutes(i.closesAt);

        return {
          tenantId,
          professionalId,
          dayOfWeek,
          opensAt,
          closesAt,
        };
      });
    });

    // const result = validateOverlaps();

    // if (!result) {
    //   throw new BadRequestException('Algunos horarios están superpuestos, por favor verifique.');
    // }

    await this.workingHoursRepository.deleteMany(tenantId, professionalId, tx);

    return this.workingHoursRepository.createMany({ data: workingHours }, tx);
  }
}
