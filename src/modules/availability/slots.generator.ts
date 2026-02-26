import { Injectable } from '@nestjs/common';
import { dateToMinutes, minutesToTime } from 'src/common/utils/time/time.util';
import {
  FetchedAppointmentBlock,
  FilterByMinAdvancedMinutesParams,
  FilterOverlappingSlotsParams,
  FilterPastSlotsParams,
  GenerateDynamicSlotsParams,
  GenerateFixedSlotsParams,
  GenerateParams,
  GenerateSlotsFromBlocksParams,
  IsSlotOverlappingParams,
} from './types/slots.type';

@Injectable()
export class SlotsGenerator {
  private blockToMinutes(block: FetchedAppointmentBlock, date: Date): { startMinutes: number; endMinutes: number } {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);

    // Calculate minutes from start of the target date
    const startMinutes = blockStart.getHours() * 60 + blockStart.getMinutes();
    const endMinutes = blockEnd.getHours() * 60 + blockEnd.getMinutes();

    return { startMinutes, endMinutes };
  }

  private isSlotOverlapping({ slot, slotDuration, block, date }: IsSlotOverlappingParams): boolean {
    const slotEnd = slot + slotDuration;
    const { startMinutes, endMinutes } = this.blockToMinutes(block, date);

    return slot < endMinutes && slotEnd > startMinutes;
  }

  private filterOverlappingSlots({ slots, slotDuration, appointmentBlocks, date }: FilterOverlappingSlotsParams) {
    return slots.filter((slot) => !appointmentBlocks.some((block) => this.isSlotOverlapping({ slot, slotDuration, block, date })));
  }

  private filterPastSlots({ slots, date }: FilterPastSlotsParams) {
    const now = new Date();
    const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

    if (!isToday) return slots;

    return slots.filter((slot) => {
      const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(slot / 60), slot % 60);
      return slotDate > now;
    });
  }

  private filterByMinAdvancedMinutes({ slots, minAdvancedMinutes, date }: FilterByMinAdvancedMinutesParams) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday =
      now.getUTCFullYear() === date.getUTCFullYear() && now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() === date.getUTCDate();

    return slots.filter((slot) => {
      if (isToday) {
        return slot >= nowMinutes + minAdvancedMinutes;
      }
      return true;
    });
  }

  private formatSlotsHumanReadble(slots: number[]): string[] {
    return slots.map((slot) => minutesToTime(slot));
  }

  private generateFixedSlots({ blocks, interval }: GenerateFixedSlotsParams): number[] {
    const slots: number[] = [];
    for (const block of blocks) {
      for (let i = block.startMinutes; i < block.endMinutes; i += interval) {
        slots.push(i);
      }
    }
    return slots;
  }

  private generateDynamicSlots({ blocks, serviceDuration }: GenerateDynamicSlotsParams): number[] {
    const slots: number[] = [];
    for (const block of blocks) {
      let start = block.startMinutes;
      while (start + serviceDuration <= block.endMinutes) {
        slots.push(start);
        start += serviceDuration;
      }
    }
    return slots;
  }

  private generateSlotsFromBlocks({ strategy, blocks, interval, serviceDuration }: GenerateSlotsFromBlocksParams): number[] {
    switch (strategy) {
      case 'dynamic':
        return this.generateDynamicSlots({ blocks, serviceDuration });
      case 'slot':
        return this.generateFixedSlots({ blocks, interval });
      default:
        return this.generateFixedSlots({ blocks, interval });
    }
  }

  generate(params: GenerateParams): string[] {
    const { strategy, blocks, interval, serviceDuration, appointmentBlocks, date, minAdvancedMinutes } = params;

    let slots = this.generateSlotsFromBlocks({ strategy, blocks, interval, serviceDuration });
    slots = this.filterPastSlots({ slots, date });
    slots = this.filterOverlappingSlots({ slots, slotDuration: serviceDuration, appointmentBlocks, date });
    slots = this.filterByMinAdvancedMinutes({ slots, minAdvancedMinutes, date });

    return this.formatSlotsHumanReadble(slots);
  }
}
