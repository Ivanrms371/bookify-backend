import { BadRequestException, Injectable } from '@nestjs/common';
import { addDays, getDay, isAfter, startOfDay } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import { AvailabilityQuery } from 'src/shared/infrastructure/queries/availability.query';
import { SlotsGenerator } from './slots.generator';
import { dateToMinutes } from 'src/common/utils/time/time.util';
import { AvailabilityConfigMapper } from './utils/availability-config.mapper';
import { Block } from './types/slots.type';
import { AppointmentsWithBlocks, FindNextAvailableDateParams, ScheduleException, WorkingHour } from './types/availability.type';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly slotsGenerator: SlotsGenerator,
    private readonly availability: AvailabilityQuery,
    private readonly availabilityMapper: AvailabilityConfigMapper,
  ) {}

  private readonly MAX_DAYS = 30;

  private hasSlots(slots: string[]) {
    return slots.length > 0;
  }

  async getBaseConfig(employeeId: string) {
    const config = await this.availability.getAvailabilityConfig(employeeId);

    if (!config || !config?.tenant?.settings) {
      throw new BadRequestException('No se encontro disponibilidad para la configuracion base');
    }

    const availabilityConfig = this.availabilityMapper.toAvailabilityConfig({
      ...config,
      tenant: {
        ...config.tenant,
        settings: config.tenant.settings,
      },
    });

    const nowUtc = new Date();
    const localDate = toZonedTime(nowUtc, availabilityConfig.timeZone);

    const { exceptions } = await this.availability.getAppointmentsAndExceptions(employeeId, localDate, availabilityConfig.maxAdvancedDays);

    const nextResponse = await this.findNextAvailableDate({
      employeeId,
      date: localDate,
      strategy: 'dynamic',
      serviceDuration: 45,
      config: availabilityConfig,
    });

    return {
      workingHours: availabilityConfig.workingHours,
      exceptions,
      maxAdvancedDays: availabilityConfig.maxAdvancedDays,
      timeZone: availabilityConfig.timeZone,
      nextAvailableDate: nextResponse.nextAvailableDate,
    };
  }

  async getSlots(employeeId: string, dateParam?: string) {
    const config = await this.availability.getAvailabilityConfig(employeeId);

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

    if (dateParam) {
      const parsedDate = new Date(`${dateParam}T00:00:00`);
      const targetDate = toZonedTime(parsedDate, availabilityConfig.timeZone);
      const day = getDay(targetDate);

      const dayData = await this.availability.getAppointmentsAndExceptions(employeeId, targetDate, 0);
      const activeException = this.findExceptionForDate(targetDate, day, dayData.exceptions);
      const busyBlocks = this.resolveBusyBlocks(dayData.appointments, availabilityConfig.timeZone);
      const workBlocks = this.resolveWorkingHours(availabilityConfig.workingHours, day, activeException);

      const slots = this.slotsGenerator.generate({
        strategy: 'dynamic',
        workBlocks,
        busyBlocks,
        serviceDuration: 45,
        date: parsedDate,
        config: availabilityConfig,
      });

      return { slots };
    }

    const nowUtc = new Date();
    const localDate = toZonedTime(nowUtc, availabilityConfig.timeZone);
    const day = getDay(localDate);

    // Get Appointments and Exceptions (only today)
    const todayData = await this.availability.getAppointmentsAndExceptions(employeeId, localDate, 0);

    // Find exception for today
    const todayException = this.findExceptionForDate(localDate, day, todayData.exceptions);

    // Resolve Busy Blocks (appointments only)
    const busyBlocks = this.resolveBusyBlocks(todayData.appointments, availabilityConfig.timeZone);

    // Exception overrides working hours
    const workBlocks = this.resolveWorkingHours(availabilityConfig.workingHours, day, todayException);

    // Generate Slots
    const slots = this.slotsGenerator.generate({
      strategy: 'dynamic',
      workBlocks,
      busyBlocks,
      serviceDuration: 45,
      date: nowUtc,
      config: availabilityConfig,
    });

    // Check if there are slots
    if (this.hasSlots(slots)) {
      return {
        nextAvailableDate: localDate,
        slots,
      };
    }

    // Find next available date
    const nextResponse = await this.findNextAvailableDate({
      employeeId,
      date: localDate,
      strategy: 'dynamic',
      serviceDuration: 45,
      config: availabilityConfig,
    });

    return {
      slots: [],
      nextAvailableDate: nextResponse.nextAvailableDate,
    };
  }

  private async findNextAvailableDate({ employeeId, date, config, serviceDuration }: FindNextAvailableDateParams) {
    const { appointments, exceptions } = await this.availability.getAppointmentsAndExceptions(employeeId, date, this.MAX_DAYS);

    const busyBlockGroups = this.groupBusyBlocksByDay(appointments, config.timeZone);
    const exceptionMap = this.groupExceptionsByDay(exceptions);

    const maxAdvancedDays = config.maxAdvancedDays || this.MAX_DAYS;

    for (let i = 0; i < maxAdvancedDays; i++) {
      const currentDate = addDays(date, i);
      const key = format(currentDate, 'yyyy-MM-dd', { timeZone: config.timeZone });

      const busyBlocks = busyBlockGroups.get(key) || [];
      const exception = exceptionMap.get(key);

      // Exception overrides working hours
      const workBlocks = this.resolveWorkingHours(config.workingHours, getDay(currentDate), exception);

      const slots = this.slotsGenerator.generate({
        strategy: 'dynamic',
        workBlocks,
        busyBlocks,
        serviceDuration,
        date: currentDate,
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
    return exceptions.find(
      (ex) => ex.daysOfWeek.includes(dayOfWeek) && !isAfter(startOfDay(ex.startDate), day) && !isAfter(day, startOfDay(ex.endDate)),
    );
  }

  private groupExceptionsByDay(exceptions: ScheduleException[]): Map<string, ScheduleException> {
    const map = new Map<string, ScheduleException>();
    const getKey = (date: Date) => format(date, 'yyyy-MM-dd');

    for (const exception of exceptions) {
      let current = startOfDay(exception.startDate);
      const end = startOfDay(exception.endDate);

      while (!isAfter(current, end)) {
        const dayOfWeek = getDay(current);

        if (exception.daysOfWeek.includes(dayOfWeek)) {
          map.set(getKey(current), exception);
        }

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
        const localStartTime = toZonedTime(block.startTime, timeZone);
        const localEndTime = toZonedTime(block.endTime, timeZone);
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
        const localStartTime = toZonedTime(block.startTime, timeZone);
        const localEndTime = toZonedTime(block.endTime, timeZone);

        blocks.push({
          opensAt: dateToMinutes(localStartTime, timeZone),
          closesAt: dateToMinutes(localEndTime, timeZone),
        });
      }
    }
    return blocks;
  }

  private resolveWorkingHours(workingHours: WorkingHour[], day: number, exception?: ScheduleException): Block[] {
    console.log({ exception, day });
    if (exception && exception.daysOfWeek.includes(day)) {
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
}
