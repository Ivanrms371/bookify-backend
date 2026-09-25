import { Injectable } from '@nestjs/common';
import { TZDate } from '@date-fns/tz';
import { addDays, addMinutes, differenceInMinutes, endOfDay, parseISO, startOfDay, format } from 'date-fns';
import { GenerateSlotsContext, TimeRange } from './types/slots.types';
import { AvailableSlot } from './types/availability.types';
import { hasConflict, isWithinOperationalRanges } from './utils/date-intervals.util';

@Injectable()
export class SlotsGenerator {
  generate(ctx: GenerateSlotsContext): AvailableSlot[] {
    // 1. If there is a total closure exception for the venue or professional
    if (ctx.isFullyClosed) {
      return [];
    }

    // 2. Determine base operational windows
    let operationalRanges: TimeRange[] = [];

    if (ctx.exceptionBlocks.length > 0) {
      // If exception blocks are configured, these replace standard working hours
      operationalRanges = this.normalizeRanges(ctx.exceptionBlocks);
    } else {
      // Intersection between venue schedule and professional schedule
      operationalRanges = this.normalizeRanges(ctx.workingHours);
    }

    if (operationalRanges.length === 0) {
      return [];
    }

    // 3. Convert appointments and blocks to local minutes of targetDate
    const busyRangesLocal = this.convertUtcToLocalMinutes(ctx.busyIntervalsUtc, ctx.targetDate, ctx.timeZone, ctx.bufferMinutes);

    // 4. Subtract busy intervals (appointments + buffers) from operational schedules
    // const freeRanges = this.subtractRanges(operationalRanges, busyRangesLocal);

    // 5. Slice free ranges into slots based on duration and interval
    // const rawSlots = this.sliceIntoSlots(freeRanges, ctx.serviceDuration, ctx.slotInterval, ctx.targetDate, ctx.timeZone);

    const rawSlots = this.generateAvailableSlots(
      operationalRanges,
      busyRangesLocal,
      ctx.serviceDuration,
      ctx.slotInterval,
      ctx.targetDate,
      ctx.timeZone,
    );

    // 6. Filter by advance booking limits (minAdvancedMinutes and maxAdvancedDays)
    return this.filterByAdvancedLimits(rawSlots, ctx.timeZone, ctx.minAdvancedMinutes, ctx.maxAdvancedDays);
  }

  validateSlot(startTimeUtc: string, ctx: GenerateSlotsContext): boolean {
    if (ctx.isFullyClosed) {
      return false;
    }

    // 1. Validate advance booking limits
    const candidateDate = parseISO(startTimeUtc);
    if (!this.isWithinAdvancedLimits(candidateDate, ctx.timeZone, ctx.minAdvancedMinutes, ctx.maxAdvancedDays)) {
      return false;
    }

    // 2. Convert candidate slot to minutes of the local day
    const [year, month, day] = ctx.targetDate.split('-').map(Number);
    const dayStart = startOfDay(new TZDate(year, month - 1, day, ctx.timeZone));
    const candidateStartTz = new TZDate(candidateDate, ctx.timeZone);

    const opensAt = Math.floor(differenceInMinutes(candidateStartTz, dayStart));
    const closesAt = opensAt + ctx.serviceDuration;
    const candidateRange: TimeRange = { opensAt, closesAt };

    // 3. Validate operational hours
    const operationalRanges = this.resolveOperationalRanges(ctx);
    if (!isWithinOperationalRanges(candidateRange, operationalRanges)) {
      return false;
    }

    // 4. Validate conflicts with bookings and buffers
    const busyRangesLocal = this.convertUtcToLocalMinutes(ctx.busyIntervalsUtc, ctx.targetDate, ctx.timeZone, ctx.bufferMinutes);

    if (hasConflict(candidateRange, busyRangesLocal)) {
      return false;
    }

    return true;
  }

  public resolveOperationalRanges(ctx: Pick<GenerateSlotsContext, 'exceptionBlocks' | 'workingHours'>): TimeRange[] {
    if (ctx.exceptionBlocks.length > 0) {
      return this.normalizeRanges(ctx.exceptionBlocks);
    }
    return this.normalizeRanges(ctx.workingHours);
  }

  private isWithinAdvancedLimits(date: Date, timeZone: string, minMinutes: number, maxDays: number): boolean {
    const now = new TZDate(new Date(), timeZone);
    const earliest = addMinutes(now, minMinutes);
    const latest = endOfDay(addDays(now, maxDays));
    return date >= earliest && date <= latest;
  }

  /**
   * Subtracts busy ranges from available time windows
   */
  private subtractRanges(available: TimeRange[], busy: TimeRange[]): TimeRange[] {
    let current = [...available];

    for (const b of busy) {
      const next: TimeRange[] = [];
      for (const a of current) {
        // No overlap
        if (b.closesAt <= a.opensAt || b.opensAt >= a.closesAt) {
          next.push(a);
          continue;
        }
        // Left fragment remains
        if (b.opensAt > a.opensAt) {
          next.push({ opensAt: a.opensAt, closesAt: b.opensAt });
        }
        // Right fragment remains
        if (b.closesAt < a.closesAt) {
          next.push({ opensAt: b.closesAt, closesAt: a.closesAt });
        }
      }
      current = next;
    }

    return current;
  }

  /**
   * Splits continuous free time windows into slots based on service duration and interval
   */
  private sliceIntoSlots(ranges: TimeRange[], duration: number, interval: number, targetDate: string, timeZone: string): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const [year, month, day] = targetDate.split('-').map(Number);
    const dayStart = new TZDate(year, month - 1, day, 0, 0, 0, timeZone);

    for (const range of ranges) {
      let cursor = range.opensAt;
      while (cursor + duration <= range.closesAt) {
        const slotStart = addMinutes(dayStart, cursor);
        const slotEnd = addMinutes(dayStart, cursor + duration);

        slots.push({
          time: format(slotStart, 'HH:mm'),
          startsAt: slotStart.toISOString(),
          endsAt: slotEnd.toISOString(),
        });

        cursor += interval;
      }
    }

    return slots;
  }

  /**
   * Iterates through operational schedules and generates slots that do not conflict with any busy period
   */
  private generateAvailableSlots(
    operationalRanges: TimeRange[],
    busyRanges: TimeRange[],
    duration: number,
    interval: number,
    targetDate: string,
    timeZone: string,
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];
    const [year, month, day] = targetDate.split('-').map(Number);
    const dayStart = startOfDay(new TZDate(year, month - 1, day, 0, 0, 0, timeZone));

    for (const range of operationalRanges) {
      let cursor = range.opensAt;

      while (cursor + duration <= range.closesAt) {
        const candidate: TimeRange = {
          opensAt: cursor,
          closesAt: cursor + duration,
        };

        // If it does NOT conflict with any appointment or block, it is a valid slot
        if (!hasConflict(candidate, busyRanges)) {
          const slotStart = addMinutes(dayStart, candidate.opensAt);
          const slotEnd = addMinutes(dayStart, candidate.closesAt);

          slots.push({
            time: format(slotStart, 'HH:mm'),
            startsAt: slotStart.toISOString(),
            endsAt: slotEnd.toISOString(),
          });
        }

        cursor += interval;
      }
    }

    return slots;
  }

  /**
   * Converts absolute UTC dates from DB to minutes from local midnight
   */
  private convertUtcToLocalMinutes(
    busyList: Array<{ startsAt: Date; endsAt: Date }>,
    targetDate: string,
    timeZone: string,
    bufferMinutes: number,
  ): TimeRange[] {
    const [year, month, day] = targetDate.split('-').map(Number);

    const baseDate = new TZDate(year, month - 1, day, timeZone);

    const dayStart = startOfDay(baseDate);
    const dayEnd = endOfDay(baseDate);

    const ranges: TimeRange[] = [];

    for (const item of busyList) {
      // Convert UTC dates to TZDate instances in the tenant's timezone
      const busyStart = new TZDate(item.startsAt, timeZone);
      const busyEnd = addMinutes(new TZDate(item.endsAt, timeZone), bufferMinutes);

      // Check if it intersects with the target day
      if (busyEnd <= dayStart || busyStart >= dayEnd) {
        continue;
      }

      const opensAt = Math.max(0, Math.floor(differenceInMinutes(busyStart, dayStart)));
      const closesAt = Math.min(1440, Math.ceil(differenceInMinutes(busyEnd, dayStart)));

      if (opensAt < closesAt) {
        ranges.push({ opensAt, closesAt });
      }
    }

    return this.normalizeRanges(ranges);
  }

  /**
   * Filters slots in real time relative to now (min/max advance booking limits)
   */
  private filterByAdvancedLimits(slots: AvailableSlot[], timeZone: string, minMinutes: number, maxDays: number): AvailableSlot[] {
    const now = new TZDate(new Date(), timeZone);
    const earliest = addMinutes(now, minMinutes);
    const latest = endOfDay(addDays(now, maxDays));

    return slots.filter((slot) => {
      const slotTime = parseISO(slot.startsAt);
      return slotTime >= earliest && slotTime <= latest;
    });
  }

  /**
   * Sorts and merges contiguous or overlapping intervals
   */
  private normalizeRanges(ranges: TimeRange[]): TimeRange[] {
    if (ranges.length <= 1) return ranges;
    const sorted = [...ranges].sort((a, b) => a.opensAt - b.opensAt);
    const merged: TimeRange[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = merged[merged.length - 1];

      if (current.opensAt <= prev.closesAt) {
        prev.closesAt = Math.max(prev.closesAt, current.closesAt);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }
}
