import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AvailabilityRepository } from './availability.repository';
import { SlotsGenerator } from './slots-generator';
import { tz, TZDate } from '@date-fns/tz';
import {
  addDays,
  differenceInCalendarDays,
  getDay,
  isAfter,
  isValid,
  format,
  endOfDay,
  startOfDay,
  parseISO,
  addMinutes,
  isBefore,
} from 'date-fns';
import {
  AppointmentAvailabilityResponse,
  AvailabilityOverviewResponse,
  DateRangeResolutionResult,
  DayAppointmentAvailabilitySummary,
  DayAvailabilityResponse,
  DayOverviewItem,
  DayOverviewStatus,
  GetAppointmentAvailabilityParams,
  DaySlotsSummary,
  GetAvailabilityOverviewParams,
  GetDayAvailabilityParams,
  ValidateSlotAvailabilityParams,
} from './types/availability.types';
import { BusyIntervalUtc, GenerateSlotsContext, TimeRange } from './types/slots.types';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly availabilityRepository: AvailabilityRepository,
    private readonly slotsGenerator: SlotsGenerator,
  ) {}

  private readonly MAX_DAYS_SCAN = 30;

  /**
   * Retrieves available time slots for a specific day.
   *
   * If the requested date has availability, returns the calculated slots.
   * If the day is unavailable (closed, professional off, or fully booked),
   * scans forward (within the allowed range) to suggest the next available date (`nextAvailable`).
   *
   * @param params Query parameters (tenantId, professionalId, serviceId, date).
   * @returns Day availability details (`isAvailable`), slots array, and next available date if applicable.
   */
  async getAvailableSlotsByDay(params: GetDayAvailabilityParams): Promise<DayAvailabilityResponse> {
    const { days } = await this.resolveSlotsForDateRange({
      tenantId: params.tenantId,
      professionalId: params.professionalId,
      serviceId: params.serviceId,
      startDateStr: params.date,
      stopOnFirstFound: true,
    });

    const requestedDay = days.find((s) => s.date === params.date);
    const targetSlots = requestedDay?.slots ?? [];

    if (targetSlots.length > 0) {
      return {
        date: params.date,
        isAvailable: true,
        slots: targetSlots,
      };
    }

    const nextAvailableDay = days.find((s) => s.date !== params.date && s.slots.length > 0);

    return {
      date: params.date,
      isAvailable: false,
      slots: [],
      nextAvailable: nextAvailableDay
        ? {
            date: nextAvailableDay.date,
            slots: nextAvailableDay.slots,
          }
        : null,
    };
  }

  /**
   * Generates an availability overview/summary across a given date range.
   *
   * Intended for calendar views and heatmaps.
   * Categorizes each day in the range into status values:
   * - `AVAILABLE`: Slots available and above the saturation threshold.
   * - `SATURATED`: Slots available but count <= `saturationThreshold`.
   * - `EMPTY`: Has working hours but all slots are booked.
   * - `CLOSED`: Business closed, professional off, or fully closed by exception.
   *
   * @param params Query parameters (date range, tenant/professional/service IDs, optional saturation threshold).
   * @returns Date-indexed dictionary ('YYYY-MM-DD') with status, available count, and status reason.
   */
  async getAvailableOverview(params: GetAvailabilityOverviewParams): Promise<AvailabilityOverviewResponse> {
    const { tenantId, professionalId, serviceId, startDate, endDate, saturationThreshold = 3 } = params;

    const { timeZone, days } = await this.resolveSlotsForDateRange({
      tenantId,
      professionalId,
      serviceId,
      startDateStr: startDate,
      endDateStr: endDate,
      stopOnFirstFound: false,
    });

    const daysOverview: Record<string, DayOverviewItem> = {};

    for (const day of days) {
      const count = day.slots.length;
      let status: DayOverviewStatus;

      if (!day.hasAvailability) {
        status = day.reason === 'FULLY_BOOKED' ? 'EMPTY' : 'CLOSED';
      } else if (count <= saturationThreshold) {
        status = 'SATURATED';
      } else {
        status = 'AVAILABLE';
      }

      daysOverview[day.date] = {
        date: day.date,
        status,
        availableCount: count,
        reason: day.message,
      };
    }

    return {
      timeZone,
      days: daysOverview,
    };
  }

  async getAppointmentAvailability(params: GetAppointmentAvailabilityParams): Promise<AppointmentAvailabilityResponse> {
    const { tenantId, professionalId, serviceId, startDate, endDate, excludeAppointmentId } = params;

    const { settings, professional, service } = await this.loadConfiguration(tenantId, professionalId, serviceId);
    const timeZone = settings.timeZone || 'America/Montevideo';

    const startLocal = startOfDay(parseISO(startDate), { in: tz(timeZone) });

    if (!isValid(startLocal)) {
      throw new BadRequestException('Fecha de inicio inválida. Use YYYY-MM-DD.');
    }

    const endLocal = endOfDay(parseISO(endDate ?? startDate), { in: tz(timeZone) });

    if (!isValid(endLocal) || isAfter(startLocal, endLocal)) {
      throw new BadRequestException('Rango de fechas inválido.');
    }

    const timeline = await this.availabilityRepository.getTimelineForRange({
      tenantId,
      professionalId,
      rangeStartUtc: new Date(startLocal.toISOString()),
      rangeEndUtc: new Date(endLocal.toISOString()),
    });
    const busyIntervalsUtc = this.extractBusyIntervals(
      excludeAppointmentId ? timeline.appointments.filter((appointment) => appointment.id !== excludeAppointmentId) : timeline.appointments,
    );

    const daysCount = differenceInCalendarDays(endLocal, startLocal) + 1;
    const days: DayAppointmentAvailabilitySummary[] = [];

    for (let i = 0; i < daysCount; i++) {
      const currentDayLocal = addDays(startLocal, i);
      const currentDateStr = format(currentDayLocal, 'yyyy-MM-dd');
      const dayContext = this.buildDayContext({
        currentDayLocal,
        timeZone,
        timeline,
        settings,
        professional,
        service,
        busyIntervalsUtc,
      });

      if (dayContext.workingHours.length === 0) {
        days.push({
          date: currentDateStr,
          hasAvailability: false,
          reason: timeline.professionalHours.length > 0 ? 'PROFESSIONAL_OFF' : 'BUSINESS_CLOSED',
          slots: [],
        });
        continue;
      }

      const activeFullClosure = timeline.exceptions.find((e) => {
        const currentDayStartUtc = new Date(startOfDay(currentDayLocal).getTime());
        const currentDayEndUtc = new Date(endOfDay(currentDayLocal).getTime());
        return e.isClosed && e.startDate <= currentDayEndUtc && e.endDate >= currentDayStartUtc;
      });

      if (dayContext.isFullyClosed) {
        days.push({
          date: currentDateStr,
          hasAvailability: false,
          reason: 'SCHEDULE_EXCEPTION',
          message: activeFullClosure?.reason ?? undefined,
          slots: [],
        });
        continue;
      }

      const slots = this.slotsGenerator.generateAppointmentAvailability(dayContext);
      const hasBookableSlot = slots.some((slot) => slot.status !== 'busy');

      days.push({
        date: currentDateStr,
        hasAvailability: hasBookableSlot,
        reason: hasBookableSlot ? 'AVAILABLE' : 'FULLY_BOOKED',
        slots,
      });
    }

    return {
      timeZone,
      days,
    };
  }

  /**
   * Validates whether a specific time slot is available for booking or rescheduling.
   *
   * Checks that:
   * 1. The start time meets the minimum advance booking notice (`minAdvancedMinutes`).
   * 2. The entire duration falls within effective working hours (custom or business).
   * 3. The time slot does not intersect with any schedule exceptions or full closures.
   * 4. The time slot does not overlap with existing appointments or their buffer times.
   *
   * @param params Validation parameters (tenant, professional, service, start time, optional ignoreMinAdvanced flag).
   * @returns `true` if the slot is open and available to book; otherwise `false`.
   * @throws BadRequestException If the startTime format is invalid.
   */
  async isSlotAvailable(params: ValidateSlotAvailabilityParams): Promise<boolean> {
    const { tenantId, professionalId, serviceId, startsAt, ignoreMinAdvanced = false, allowPast = false, excludeAppointmentId } = params;

    const { settings, professional, service } = await this.loadConfiguration(tenantId, professionalId, serviceId);

    const timeZone = settings.timeZone || 'America/Montevideo';
    const bufferMinutes = settings.bufferTimeMinutes;
    const minAdvancedMinutes = professional.minAdvancedMinutes ?? settings.minAdvancedMinutes;

    const slotDate = parseISO(startsAt);
    if (!isValid(slotDate)) {
      throw new BadRequestException('Formato de fecha inválido para startsAt.');
    }

    const minStartTime = addMinutes(new Date(), ignoreMinAdvanced ? 0 : minAdvancedMinutes);

    if (!allowPast && isBefore(slotDate, minStartTime)) {
      return false;
    }

    const localDate = new TZDate(slotDate, timeZone);
    const dayStartUtc = new Date(startOfDay(localDate).toISOString());
    const dayEndUtc = new Date(endOfDay(localDate).toISOString());

    const timeline = await this.availabilityRepository.getTimelineForRange({
      tenantId,
      professionalId,
      rangeStartUtc: dayStartUtc,
      rangeEndUtc: dayEndUtc,
    });

    const busyIntervals = this.extractBusyIntervals(
      excludeAppointmentId ? timeline.appointments.filter((appt) => appt.id !== excludeAppointmentId) : timeline.appointments,
    );

    const dayContext = this.buildDayContext({
      currentDayLocal: localDate,
      timeZone,
      timeline,
      settings,
      professional,
      service,
      busyIntervalsUtc: busyIntervals,
    });

    if (dayContext.isFullyClosed || dayContext.workingHours.length === 0) {
      return false;
    }

    const requestedStart = slotDate;
    const requestedEnd = addMinutes(requestedStart, service.durationMinutes + bufferMinutes);

    const isWithinWorkingHours = this.isWithinWorkingHours(requestedStart, requestedEnd, dayContext.workingHours, timeZone);

    if (!isWithinWorkingHours) {
      return false;
    }

    const hasOverlap = busyIntervals.some(({ startsAt, endsAt }) => startsAt < requestedEnd && endsAt > requestedStart);

    if (hasOverlap) {
      return false;
    }

    return true;
  }

  /**
   * Checks whether a given time interval (start to end) is completely contained
   * within any of the active working hour ranges for the day.
   */
  private isWithinWorkingHours(startTime: Date, endTime: Date, workingHours: TimeRange[], timeZone: string): boolean {
    const start = new TZDate(startTime, timeZone);
    const end = new TZDate(endTime, timeZone);

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    return workingHours.some(({ opensAt, closesAt }) => startMinutes >= opensAt && endMinutes <= closesAt);
  }

  /**
   * Resolves and calculates available slots across a date range day by day.
   *
   * Core orchestrator method that:
   * 1. Loads configuration for the business, professional, and service.
   * 2. Fetches timeline data (appointments, exceptions, working hours) in UTC for the entire range.
   * 3. Iterates day by day in the local timezone, applying exceptions and working hour rules.
   * 4. Delegates slot mathematical generation and overlap filtering to `SlotsGenerator`.
   * 5. Supports early termination (`stopOnFirstFound`) when scanning for the next available day.
   *
   * @param params Date range configuration, entity IDs, and early exit flag.
   * @returns Summary of each day's availability and the resolved timezone.
   * @throws NotFoundException If settings, service, or professional cannot be found.
   * @throws BadRequestException If date parameters are invalid.
   */
  private async resolveSlotsForDateRange(params: {
    tenantId: string;
    professionalId: string;
    serviceId: string;
    startDateStr: string;
    endDateStr?: string;
    stopOnFirstFound?: boolean;
  }): Promise<DateRangeResolutionResult> {
    const { tenantId, professionalId, serviceId, startDateStr, endDateStr, stopOnFirstFound = false } = params;

    const { settings, professional, service } = await this.availabilityRepository.getConfigurationContext(
      tenantId,
      professionalId,
      serviceId,
    );

    if (!settings) throw new NotFoundException('Configuración de negocio no encontrada.');
    if (!service) throw new NotFoundException('Servicio inactivo o inexistente.');
    if (!professional) throw new NotFoundException('Profesional no asignado al servicio.');

    const timeZone = settings.timeZone || 'America/Montevideo';

    const startLocal = startOfDay(parseISO(startDateStr), { in: tz(timeZone) });

    if (!isValid(startLocal)) {
      throw new BadRequestException('Fecha de inicio inválida. Use YYYY-MM-DD.');
    }

    let endLocal: TZDate;

    if (endDateStr) {
      endLocal = endOfDay(parseISO(endDateStr), { in: tz(timeZone) });
      if (!isValid(endLocal) || isAfter(startLocal, endLocal)) {
        throw new BadRequestException('Rango de fechas inválido.');
      }
    } else {
      const allowedMaxDays = professional.maxAdvancedDays ?? settings.maxAdvancedDays ?? 30;
      const daysToScan = Math.min(allowedMaxDays, this.MAX_DAYS_SCAN);
      endLocal = endOfDay(addDays(startLocal, daysToScan));
    }
    const timeline = await this.availabilityRepository.getTimelineForRange({
      tenantId,
      professionalId,
      rangeStartUtc: new Date(startLocal.toISOString()),
      rangeEndUtc: new Date(endLocal.toISOString()),
    });

    const allBusyIntervals: Array<{ startsAt: Date; endsAt: Date }> = [];
    for (const appt of timeline.appointments) {
      allBusyIntervals.push({ startsAt: appt.startsAt, endsAt: appt.endsAt });
      if (appt.blocks) {
        for (const block of appt.blocks) {
          allBusyIntervals.push({ startsAt: block.startsAt, endsAt: block.endsAt });
        }
      }
    }

    const slotInterval = professional.slotIntervalMinutes || settings.slotIntervalMinutes || 30;
    const minAdvancedMinutes = professional.minAdvancedMinutes ?? settings.minAdvancedMinutes ?? 30;
    const maxAdvancedDays = professional.maxAdvancedDays ?? settings.maxAdvancedDays ?? 30;
    const bufferMinutes = settings.bufferTimeMinutes ?? 0;

    const hasCustomSchedule = timeline.professionalHours.length > 0;

    const daysCount = differenceInCalendarDays(endLocal, startLocal) + 1;
    const days: DaySlotsSummary[] = [];

    for (let i = 0; i < daysCount; i++) {
      const currentDayLocal = addDays(startLocal, i);
      const currentDateStr = format(currentDayLocal, 'yyyy-MM-dd');
      const dayOfWeek = getDay(currentDayLocal); // 0 (Sun) a 6 (Sat)

      const effectiveWorkingHours = hasCustomSchedule
        ? timeline.professionalHours.filter((h) => h.dayOfWeek === dayOfWeek)
        : timeline.tenantHours.filter((h) => h.dayOfWeek === dayOfWeek);

      if (effectiveWorkingHours.length === 0) {
        days.push({
          date: currentDateStr,
          hasAvailability: false,
          reason: hasCustomSchedule ? 'PROFESSIONAL_OFF' : 'BUSINESS_CLOSED',
          slots: [],
        });
        continue;
      }

      // Exceptions of the day
      const currentDayStartUtc = new Date(startOfDay(currentDayLocal).getTime());
      const currentDayEndUtc = new Date(endOfDay(currentDayLocal).getTime());

      const activeExceptions = timeline.exceptions.filter((e) => e.startDate <= currentDayEndUtc && e.endDate >= currentDayStartUtc);

      const isFullyClosed = activeExceptions.find((e) => e.isClosed) ?? false;
      if (isFullyClosed) {
        days.push({
          date: currentDateStr,
          hasAvailability: false,
          reason: 'SCHEDULE_EXCEPTION',
          message: isFullyClosed.reason ?? undefined,
          slots: [],
        });
        continue;
      }

      const exceptionBlocks = activeExceptions.flatMap((e) => e.blocks.map((b) => ({ opensAt: b.opensAt, closesAt: b.closesAt })));

      const slots = this.slotsGenerator.generate({
        targetDate: currentDateStr,
        timeZone,
        serviceDuration: service.durationMinutes,
        workingHours: effectiveWorkingHours,
        slotInterval,
        bufferMinutes,
        minAdvancedMinutes,
        maxAdvancedDays,
        isFullyClosed,
        exceptionBlocks,
        busyIntervalsUtc: allBusyIntervals,
      });

      if (slots.length === 0) {
        days.push({
          date: currentDateStr,
          hasAvailability: false,
          reason: 'FULLY_BOOKED',
          slots: [],
        });
        continue;
      }

      days.push({
        date: currentDateStr,
        hasAvailability: true,
        reason: 'AVAILABLE',
        slots,
      });

      if (stopOnFirstFound && i > 0 && slots.length > 0) {
        break;
      }
    }

    return {
      timeZone,
      days,
    };
  }

  /**
   * Loads and validates the required base configuration for tenant, professional, and service.
   *
   * @throws NotFoundException If business settings, service, or professional association are not found.
   */
  private async loadConfiguration(tenantId: string, professionalId: string, serviceId: string) {
    const { settings, professional, service } = await this.availabilityRepository.getConfigurationContext(
      tenantId,
      professionalId,
      serviceId,
    );

    if (!settings) throw new NotFoundException('Configuración de negocio no encontrada.');
    if (!service) throw new NotFoundException('Servicio inactivo o inexistente.');
    if (!professional) throw new NotFoundException('Profesional no asignado al servicio.');

    return { settings, professional, service };
  }

  /**
   * Extracts and normalizes busy intervals from appointments and internal blocks into a flat UTC range list.
   */
  private extractBusyIntervals(
    appointments: Array<{ startsAt: Date; endsAt: Date; blocks?: Array<{ startsAt: Date; endsAt: Date }> }>,
  ): BusyIntervalUtc[] {
    const intervals: BusyIntervalUtc[] = [];

    for (const appt of appointments) {
      intervals.push({ startsAt: appt.startsAt, endsAt: appt.endsAt });
      if (appt.blocks) {
        for (const block of appt.blocks) {
          intervals.push({ startsAt: block.startsAt, endsAt: block.endsAt });
        }
      }
    }

    return intervals;
  }

  /**
   * Prepares the day-specific context required for slot generation,
   * determining applicable working hours (custom vs business default)
   * and evaluating active exceptions or full closures.
   */
  private buildDayContext(params: {
    currentDayLocal: TZDate;
    timeZone: string;
    timeline: Awaited<ReturnType<AvailabilityRepository['getTimelineForRange']>>;
    settings: any;
    professional: any;
    service: any;
    busyIntervalsUtc: BusyIntervalUtc[];
  }): GenerateSlotsContext {
    const { currentDayLocal, timeZone, timeline, settings, professional, service, busyIntervalsUtc } = params;

    const dayOfWeek = getDay(currentDayLocal);
    const currentDateStr = format(currentDayLocal, 'yyyy-MM-dd');

    const hasCustomSchedule = timeline.professionalHours.length > 0;
    const workingHours = hasCustomSchedule
      ? timeline.professionalHours.filter((h) => h.dayOfWeek === dayOfWeek)
      : timeline.tenantHours.filter((h) => h.dayOfWeek === dayOfWeek);

    const currentDayStartUtc = new Date(startOfDay(currentDayLocal).getTime());
    const currentDayEndUtc = new Date(endOfDay(currentDayLocal).getTime());

    const activeExceptions = timeline.exceptions.filter((e) => e.startDate <= currentDayEndUtc && e.endDate >= currentDayStartUtc);

    const isFullyClosed = activeExceptions.some((e) => e.isClosed);
    const exceptionBlocks = activeExceptions.flatMap((e) => e.blocks.map((b) => ({ opensAt: b.opensAt, closesAt: b.closesAt })));

    return {
      targetDate: currentDateStr,
      timeZone,
      serviceDuration: service.durationMinutes,
      slotInterval: professional.slotIntervalMinutes || settings.slotIntervalMinutes || 30,
      bufferMinutes: settings.bufferTimeMinutes ?? 0,
      minAdvancedMinutes: professional.minAdvancedMinutes ?? settings.minAdvancedMinutes ?? 30,
      maxAdvancedDays: professional.maxAdvancedDays ?? settings.maxAdvancedDays ?? 30,
      workingHours,
      isFullyClosed,
      exceptionBlocks,
      busyIntervalsUtc,
    };
  }
}
