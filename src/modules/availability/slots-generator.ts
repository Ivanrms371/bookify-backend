import { Injectable } from '@nestjs/common';
import { TZDate } from '@date-fns/tz';
import { addDays, addMinutes, differenceInMinutes, endOfDay, parseISO, startOfDay, format } from 'date-fns';
import { GenerateSlotsContext, TimeRange } from './types/slots.types';
import { AvailableSlot } from './types/availability.types';
import { hasConflict, isWithinOperationalRanges } from './utils/date-intervals.util';

@Injectable()
export class SlotsGenerator {
  generate(ctx: GenerateSlotsContext): AvailableSlot[] {
    // 1. Si hay una excepción de cierre total del local o profesional
    if (ctx.isFullyClosed) {
      return [];
    }

    // 2. Determinar ventanas operativas base
    let operationalRanges: TimeRange[] = [];

    if (ctx.exceptionBlocks.length > 0) {
      // Si hay bloques de excepción configurados, estos reemplazan las horas estándar
      operationalRanges = this.normalizeRanges(ctx.exceptionBlocks);
    } else {
      // Intersección entre horario del local y horario del profesional
      operationalRanges = this.normalizeRanges(ctx.workingHours);
    }

    if (operationalRanges.length === 0) {
      return [];
    }

    // 3. Convertir citas y bloqueos a minutos locales del targetDate
    const busyRangesLocal = this.convertUtcToLocalMinutes(ctx.busyIntervalsUtc, ctx.targetDate, ctx.timeZone, ctx.bufferMinutes);

    // 4. Restar ocupaciones (citas + buffers) de los horarios operativos
    // const freeRanges = this.subtractRanges(operationalRanges, busyRangesLocal);

    // 5. Segmentar los rangos libres en slots según duración e intervalo
    // const rawSlots = this.sliceIntoSlots(freeRanges, ctx.serviceDuration, ctx.slotInterval, ctx.targetDate, ctx.timeZone);

    const rawSlots = this.generateAvailableSlots(
      operationalRanges,
      busyRangesLocal,
      ctx.serviceDuration,
      ctx.slotInterval,
      ctx.targetDate,
      ctx.timeZone,
    );

    // 6. Filtrar por límites de antelación (minAdvancedMinutes y maxAdvancedDays)
    return this.filterByAdvancedLimits(rawSlots, ctx.timeZone, ctx.minAdvancedMinutes, ctx.maxAdvancedDays);
  }

  validateSlot(startTimeUtc: string, ctx: GenerateSlotsContext): boolean {
    if (ctx.isFullyClosed) {
      return false;
    }

    // 1. Validar límites de antelación
    const candidateDate = parseISO(startTimeUtc);
    if (!this.isWithinAdvancedLimits(candidateDate, ctx.timeZone, ctx.minAdvancedMinutes, ctx.maxAdvancedDays)) {
      return false;
    }

    // 2. Convertir el candidato a minutos del día local
    const [year, month, day] = ctx.targetDate.split('-').map(Number);
    const dayStart = startOfDay(new TZDate(year, month - 1, day, ctx.timeZone));
    const candidateStartTz = new TZDate(candidateDate, ctx.timeZone);

    const opensAt = Math.floor(differenceInMinutes(candidateStartTz, dayStart));
    const closesAt = opensAt + ctx.serviceDuration;
    const candidateRange: TimeRange = { opensAt, closesAt };

    // 3. Validar horario operativo
    const operationalRanges = this.resolveOperationalRanges(ctx);
    if (!isWithinOperationalRanges(candidateRange, operationalRanges)) {
      return false;
    }

    // 4. Validar colisiones con reservas y buffers
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
   * Resta los rangos ocupados a las ventanas disponibles
   */
  private subtractRanges(available: TimeRange[], busy: TimeRange[]): TimeRange[] {
    let current = [...available];

    for (const b of busy) {
      const next: TimeRange[] = [];
      for (const a of current) {
        // No hay solapamiento
        if (b.closesAt <= a.opensAt || b.opensAt >= a.closesAt) {
          next.push(a);
          continue;
        }
        // Queda fragmento a la izquierda
        if (b.opensAt > a.opensAt) {
          next.push({ opensAt: a.opensAt, closesAt: b.opensAt });
        }
        // Queda fragmento a la derecha
        if (b.closesAt < a.closesAt) {
          next.push({ opensAt: b.closesAt, closesAt: a.closesAt });
        }
      }
      current = next;
    }

    return current;
  }

  /**
   * Divide franjas continuas de tiempo libre en slots según la duración del servicio
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
   * Itera los horarios operativos y emite slots que no colisionan con ninguna ocupación
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

        // Si NO colisiona con ninguna cita o bloqueo, es un slot válido
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
   * Convierte fechas absolutas UTC de DB a minutos desde la medianoche local
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
      // Convertir fechas UTC a instancias TZDate en la zona horaria del tenant
      const busyStart = new TZDate(item.startsAt, timeZone);
      const busyEnd = addMinutes(new TZDate(item.endsAt, timeZone), bufferMinutes);

      // Validar si intersecta con el día en cuestión
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
   * Filtra slots en tiempo real contra ahora (min/max anticipación)
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
   * Ordena y fusiona intervalos contiguos o solapados
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
