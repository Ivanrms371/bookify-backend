import { BadRequestException, Injectable } from '@nestjs/common';
import { addDays, endOfDay, getDay, isAfter, parseISO, startOfDay } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import { AvailabilityQuery } from 'src/shared/infrastructure/queries/availability.query';
import { SlotsGenerator } from './slots.generator';
import { dateToMinutes } from 'src/common/utils/time/time.util';
import { AvailabilityConfigMapper } from './utils/availability-config.mapper';
import { Block } from './types/slots.type';
import { AppointmentsWithBlocks, FindNextAvailableDateParams, ScheduleException, WorkingHour } from './types/availability.type';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto';
import { ServicesService } from '../services/services.service';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly slotsGenerator: SlotsGenerator,
    private readonly availability: AvailabilityQuery,
    private readonly availabilityMapper: AvailabilityConfigMapper,
    private readonly servicesService: ServicesService,
  ) {}

  private readonly MAX_DAYS = 60;

  private hasSlots(slots: string[]) {
    return slots.length > 0;
  }

  private async getAvailabilityContext(tenantId: string, professionalId: string, date?: string | Date) {
    const config = await this.availability.getAvailabilityConfig(tenantId, professionalId);

    if (!config || !config?.tenant?.settings) {
      throw new BadRequestException('No se encontro disponibilidad para la fecha');
    }

    const availabilityConfig = this.availabilityMapper.toAvailabilityConfig({
      ...config,
      tenant: {
        ...config.tenant,
        settings: config.tenant.settings,
      },
    });

    const { timeZone } = availabilityConfig;

    const targetDate = date ? toZonedTime(typeof date === 'string' ? parseISO(date) : date, timeZone) : toZonedTime(new Date(), timeZone);

    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const [appointments, exceptions] = await Promise.all([
      this.availability.getAppointmentsInRange(professionalId, start, end),
      this.availability.getExceptionsInRange(professionalId, start, end),
    ]);

    const day = getDay(targetDate);

    const exception = this.findExceptionForDate(targetDate, day, exceptions);
    const busyBlocks = this.resolveBusyBlocks(appointments, timeZone);
    const workBlocks = this.resolveWorkingHours(availabilityConfig.workingHours, day, exception);

    return {
      config: availabilityConfig,
      date: targetDate,
      busyBlocks,
      workBlocks,
    };
  }

  async getProfessionalAvailability(tenantId: string, professionalId: string, query: GetSlotsQueryDto) {
    const { config, date, workBlocks, busyBlocks } = await this.getAvailabilityContext(tenantId, professionalId, query.date);

    const service = await this.servicesService.findById(tenantId, query.serviceId);
    const { durationMinutes } = service;

    const slots = this.slotsGenerator.generate({
      strategy: 'dynamic',
      serviceDuration: durationMinutes,
      config,
      date,
      workBlocks,
      busyBlocks,
    });

    if (this.hasSlots(slots)) {
      return {
        slots,
        date: format(date, 'yyyy-MM-dd'),
      };
    }

    const { nextAvailableDate } = await this.getNextAvailableSlot({
      serviceDuration: durationMinutes,
      strategy: 'dynamic',
      date: date,
      config,
      professionalId,
    });

    return {
      slots: [],
      nextAvailableDate: nextAvailableDate ? format(nextAvailableDate, 'yyyy-MM-dd') : null,
      date,
    };
  }

  async checkAvailability(tenantId: string, professionalId: string, startsAt: Date, endsAt: Date) {
    const { config, workBlocks, busyBlocks } = await this.getAvailabilityContext(tenantId, professionalId, startsAt);

    const { timeZone } = config;

    const localStart = toZonedTime(startsAt, timeZone);
    const localEnd = toZonedTime(endsAt, timeZone);

    if (!this.isWithinWorkingHours(localStart, localEnd, workBlocks, timeZone)) {
      return false;
    }

    return !this.isOverlapping(localStart, localEnd, busyBlocks, timeZone);
  }

  private async getNextAvailableSlot({ professionalId, date, config, serviceDuration }: FindNextAvailableDateParams) {
    const maxAdvancedDays = Math.min(config.maxAdvancedDays ?? this.MAX_DAYS, this.MAX_DAYS);

    const start = startOfDay(date);
    const end = endOfDay(addDays(date, maxAdvancedDays));

    const [appointments, exceptions] = await Promise.all([
      this.availability.getAppointmentsInRange(professionalId, start, end),
      this.availability.getExceptionsInRange(professionalId, start, end),
    ]);

    const busyBlockGroups = this.groupBusyBlocksByDay(appointments, config.timeZone);
    const exceptionMap = this.groupExceptionsByDay(exceptions);

    for (let i = 0; i < maxAdvancedDays; i++) {
      const currentDate = addDays(date, i);
      const key = format(currentDate, 'yyyy-MM-dd', { timeZone: config.timeZone });

      const busyBlocks = busyBlockGroups.get(key) || [];
      const exception = exceptionMap.get(key);

      const workBlocks = this.resolveWorkingHours(config.workingHours, getDay(currentDate), exception);

      const slots = this.slotsGenerator.generate({
        strategy: 'dynamic',
        date: currentDate,
        workBlocks,
        busyBlocks,
        serviceDuration,
        config,
      });

      if (this.hasSlots(slots)) {
        return {
          maxAdvancedDays,
          nextAvailableDate: currentDate,
          slots,
        };
      }
    }

    return {
      maxAdvancedDays,
      nextAvailableDate: null,
      slots: [],
    };
  }

  private findExceptionForDate(date: Date, dayOfWeek: number, exceptions: ScheduleException[]): ScheduleException | undefined {
    const day = startOfDay(date);
    return exceptions.find((ex) => !isAfter(startOfDay(ex.startDate), day) && !isAfter(day, startOfDay(ex.endDate)));
  }

  private groupExceptionsByDay(exceptions: ScheduleException[]): Map<string, ScheduleException> {
    const map = new Map<string, ScheduleException>();
    const getKey = (date: Date) => format(date, 'yyyy-MM-dd');

    for (const exception of exceptions) {
      let current = startOfDay(exception.startDate);
      const end = startOfDay(exception.endDate);

      while (!isAfter(current, end)) {
        map.set(getKey(current), exception);
        current = addDays(current, 1);
      }
    }
    return map;
  }

  private groupBusyBlocksByDay(appointments: AppointmentsWithBlocks[], timeZone: string): Map<string, Block[]> {
    const map = new Map<string, Block[]>();
    const getKey = (date: Date) => format(date, 'yyyy-MM-dd');

    for (const appt of appointments) {
      for (const block of appt.blocks) {
        const localStartTime = toZonedTime(block.startsAt, timeZone);
        const localEndTime = toZonedTime(block.endsAt, timeZone);
        const key = getKey(localStartTime);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          opensAt: dateToMinutes(localStartTime, timeZone),
          closesAt: dateToMinutes(localEndTime, timeZone),
        });
      }
    }
    return map;
  }

  private resolveBusyBlocks(appointments: AppointmentsWithBlocks[], timeZone: string): Block[] {
    const blocks: Block[] = [];
    for (const appt of appointments) {
      for (const block of appt.blocks) {
        const localStartTime = toZonedTime(block.startsAt, timeZone);
        const localEndTime = toZonedTime(block.endsAt, timeZone);

        blocks.push({
          opensAt: dateToMinutes(localStartTime, timeZone),
          closesAt: dateToMinutes(localEndTime, timeZone),
        });
      }
    }
    return blocks;
  }

  private resolveWorkingHours(workingHours: WorkingHour[], day: number, exception?: ScheduleException): Block[] {
    if (exception) {
      if (exception.isClosed) return [];
      return exception.blocks;
    }

    const blocks: Block[] = [];
    for (const wh of workingHours) {
      if (wh.dayOfWeek === day) {
        blocks.push({
          opensAt: wh.opensAt,
          closesAt: wh.closesAt,
        });
      }
    }
    return blocks;
  }

  private isWithinWorkingHours(startsAt: Date, endsAt: Date, workBlocks: Block[], timeZone: string): boolean {
    const startMinutes = dateToMinutes(startsAt, timeZone);
    const endMinutes = dateToMinutes(endsAt, timeZone);

    return workBlocks.some((block) => {
      return startMinutes >= block.opensAt && endMinutes <= block.closesAt;
    });
  }

  private isOverlapping(startsAt: Date, endsAt: Date, busyBlocks: Block[], timeZone: string) {
    const startMinutes = dateToMinutes(startsAt, timeZone);
    const endMinutes = dateToMinutes(endsAt, timeZone);

    return busyBlocks.some((block) => startMinutes < block.closesAt && endMinutes > block.opensAt);
  }
}
