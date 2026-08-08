import { Injectable } from '@nestjs/common';
import { Block, FilterPastSlotsParams } from './types/slots.type';
import { minutesToTime } from 'src/common/utils/time/time.util';
import { AvailabilityConfig } from './types/availability-config.type';
import { toZonedTime, format } from 'date-fns-tz';
import { isBefore, isSameDay, startOfDay } from 'date-fns';

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
      for (let i = block.opensAt; i < block.closesAt; i += interval) {
        slots.push(i);
      }
    }
    return slots;
  }

  private generateDynamicSlots({ workBlocks, serviceDuration }: { workBlocks: Block[]; serviceDuration: number }) {
    const slots: number[] = [];
    for (const block of workBlocks) {
      let start = block.opensAt;
      while (start + serviceDuration <= block.closesAt) {
        slots.push(start);
        start += serviceDuration;
      }
    }
    return slots;
  }

  private filterPastSlots({ slots, date, config }: FilterPastSlotsParams) {
    const nowUtc = new Date();
    const localNow = toZonedTime(nowUtc, config.timeZone);

    const today = startOfDay(localNow);
    const targetDate = startOfDay(toZonedTime(date, config.timeZone));

    if (isBefore(targetDate, today)) {
      return [];
    }

    if (!isSameDay(targetDate, today)) {
      return slots;
    }

    const currentMinutes = localNow.getHours() * 60 + localNow.getMinutes();

    const minimumAllowedMinutes = currentMinutes + config.minAdvancedMinutes;

    return slots.filter((slot) => slot >= minimumAllowedMinutes);
  }

  private isSlotOverlapping({ slot, slotDuration, block }: { slot: number; slotDuration: number; block: Block }) {
    const slotEnd = slot + slotDuration;
    return slot < block.closesAt && slotEnd > block.opensAt;
  }

  private startsAfterSlot(block: Block, slotEnd: number) {
    return block.opensAt > slotEnd;
  }

  private filterBusyBlocks({ slots, busyBlocks, slotDuration }: { slots: number[]; busyBlocks: Block[]; slotDuration: number }) {
    return slots.filter((slot) => {
      const slotEnd = slot + slotDuration;
      for (const block of busyBlocks) {
        if (this.startsAfterSlot(block, slotEnd)) break;
        if (this.isSlotOverlapping({ slot, slotDuration, block })) return false;
      }
      return true;
    });
  }

  private orderBusyBlocks(busyBlocks: Block[]) {
    return busyBlocks.sort((a, b) => a.opensAt - b.opensAt);
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

    return this.formatSlots(slots);
  }
}
