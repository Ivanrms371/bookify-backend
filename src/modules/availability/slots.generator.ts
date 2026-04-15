import { Injectable } from '@nestjs/common';
import {
  Block,
  FilterByMinAdvancedMinutesParams,
  FilterPastSlotsParams,
  GenerateFixedSlotsParams,
  GenerateSlotsFromBlocksParams,
} from './types/slots.type';
import { isSameDay, startOfDay } from 'date-fns';
import { dateToMinutes, minutesToTime } from 'src/common/utils/time/time.util';
import { AvailabilityConfig } from './types/availability-config.type';
import { toZonedTime, format } from 'date-fns-tz';

type GenerateParams = {
  strategy: 'dynamic' | 'slot';
  busyBlocks: Block[];
  workBlocks: Block[];
  date: Date;
  serviceDuration: number;
  config: AvailabilityConfig;
};

@Injectable()
export class SlotsGenerator {
  constructor() {}

  private generateFixedSlots({ workBlocks, interval }: { workBlocks: Block[]; interval: number }): number[] {
    const slots: number[] = [];
    for (const block of workBlocks) {
      for (let i = block.startMinutes; i < block.endMinutes; i += interval) {
        slots.push(i);
      }
    }
    return slots;
  }

  private generateDynamicSlots({ workBlocks, serviceDuration }: { workBlocks: Block[]; serviceDuration: number }) {
    const slots: number[] = [];
    for (const block of workBlocks) {
      let start = block.startMinutes;
      while (start + serviceDuration <= block.endMinutes) {
        slots.push(start);
        start += serviceDuration;
      }
    }
    return slots;
  }

  private filterPastSlots({ slots, date, config }: FilterPastSlotsParams) {
    const nowUtc = new Date();
    const localNow = toZonedTime(nowUtc, config.timeZone);

    // Para comparar días es más seguro formatear a string en el timezone correcto
    const todayStr = format(localNow, 'yyyy-MM-dd', { timeZone: config.timeZone });
    const targetDateStr = format(date, 'yyyy-MM-dd', { timeZone: config.timeZone });
    const isToday = todayStr === targetDateStr;

    if (!isToday) return slots;

    // Al usar toZonedTime, sacamos la hora y minuto precisos del local
    const currentLocalHour = parseInt(format(localNow, 'HH', { timeZone: config.timeZone }), 10);
    const currentLocalMinute = parseInt(format(localNow, 'mm', { timeZone: config.timeZone }), 10);
    const nowMinutes = currentLocalHour * 60 + currentLocalMinute;

    return slots.filter((slot) => slot >= nowMinutes);
  }

  private filterByMinAdvancedMinutes({ slots, date, config: { timeZone, minAdvancedMinutes } }: FilterByMinAdvancedMinutesParams) {
    const nowUtc = new Date();

    const todayStr = format(nowUtc, 'yyyy-MM-dd', { timeZone });
    const todayDateStr = format(date, 'yyyy-MM-dd', { timeZone });
    const isToday = todayStr === todayDateStr;

    if (!isToday) return slots;

    const nowMinutes = dateToMinutes(date, timeZone);

    return slots.filter((slot) => slot >= nowMinutes + minAdvancedMinutes);
  }

  private isSlotOverlapping({ slot, slotDuration, block }: { slot: number; slotDuration: number; block: Block }) {
    const slotEnd = slot + slotDuration;
    return slot < block.endMinutes && slotEnd > block.startMinutes;
  }

  private filterBusyBlocks({ slots, busyBlocks, slotDuration }: { slots: number[]; busyBlocks: Block[]; slotDuration: number }) {
    return slots.filter((slot) => {
      const slotEnd = slot + slotDuration;
      for (const block of busyBlocks) {
        if (block.startMinutes > slotEnd) break;
        if (this.isSlotOverlapping({ slot, slotDuration, block })) return false;
      }
      return true;
    });
  }

  private orderBusyBlocks(busyBlocks: Block[]) {
    return busyBlocks.sort((a, b) => a.startMinutes - b.startMinutes);
  }

  private generateSlotsFromWorkBlocks({
    strategy,
    workBlocks,
    interval,
    serviceDuration,
  }: {
    strategy: 'dynamic' | 'slot';
    workBlocks: Block[];
    interval: number;
    serviceDuration: number;
  }) {
    switch (strategy) {
      case 'dynamic':
        return this.generateDynamicSlots({ workBlocks, serviceDuration });
      case 'slot':
        return this.generateFixedSlots({ workBlocks, interval });
      default:
        return this.generateFixedSlots({ workBlocks, interval });
    }
  }

  private formatSlots(slots: number[]) {
    const orderedSlots = [...slots].sort((a, b) => a - b);
    return orderedSlots.map((slot) => minutesToTime(slot));
  }

  generate({ strategy, busyBlocks, workBlocks, serviceDuration, date, config }: GenerateParams) {
    const orderedBusyBlocks = this.orderBusyBlocks(busyBlocks);
    let slots = this.generateSlotsFromWorkBlocks({ strategy, workBlocks, interval: config.slotIntervalMinutes, serviceDuration }).sort(
      (a, b) => a - b,
    );

    slots = this.filterBusyBlocks({ slots, busyBlocks: orderedBusyBlocks, slotDuration: serviceDuration });
    slots = this.filterPastSlots({ slots, date, config });
    slots = this.filterByMinAdvancedMinutes({ slots, date, config });

    return this.formatSlots(slots);
  }
}
