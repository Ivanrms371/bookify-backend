import { Injectable } from '@nestjs/common';
import { dateToMinutes, minutesToTime } from 'src/common/utils/time/time.util';
import {
  AppointmentBlock,
  FilterByMinAdvancedMinutesParams,
  FilterOverlappingSlotsParams,
  FilterPastSlotsParams,
  GenerateDynamicSlotsParams,
  GenerateFixedSlotsParams,
  GenerateParams,
  GenerateSlotsFromBlocksParams,
  GetAppointmentBlocksParams,
  IsSlotOverlappingParams,
} from './types/slots.type';

@Injectable()
export class SlotsGenerator {
  private getAppointmentBlocks({ appointment, allowPassiveTimeBooking: allowPassive }: GetAppointmentBlocksParams): AppointmentBlock[] {
    const start = dateToMinutes(appointment.startTime);
    const blocks: AppointmentBlock[] = [];

    blocks.push({ startMinutes: start, endMinutes: start + appointment.initialActiveMinutes, passive: false });

    if (allowPassive && appointment.passiveMinutes > 0) {
      blocks.push({
        startMinutes: start + appointment.initialActiveMinutes,
        endMinutes: start + appointment.initialActiveMinutes + appointment.passiveMinutes,
        passive: true,
      });
    }

    blocks.push({
      startMinutes: start + appointment.initialActiveMinutes + (allowPassive ? appointment.passiveMinutes : 0),
      endMinutes:
        start + appointment.initialActiveMinutes + (allowPassive ? appointment.passiveMinutes : 0) + appointment.finalActiveMinutes,
      passive: false,
    });

    return blocks;
  }

  private isSlotOverlapping({ slot, slotDuration, appointment, allowPassiveTimeBooking }: IsSlotOverlappingParams) {
    const slotEnd = slot + slotDuration;
    const blocks = this.getAppointmentBlocks({ appointment, allowPassiveTimeBooking });

    return blocks.some((block) => {
      if (block.passive && allowPassiveTimeBooking) {
        const blockDuration = block.endMinutes - block.startMinutes;

        if (slotDuration > blockDuration) return true;

        return false;
      }

      return slot < block.endMinutes && slotEnd > block.startMinutes;
    });
  }

  private filterOverlappingSlots({ slots, slotDuration, appointments, allowPassiveTimeBooking }: FilterOverlappingSlotsParams) {
    const res = slots.filter(
      (slot) => !appointments.some((appointment) => this.isSlotOverlapping({ slot, slotDuration, appointment, allowPassiveTimeBooking })),
    );
    return res;
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
    const advanceLimit = new Date(now.getTime() + minAdvancedMinutes * 60000);

    return slots.filter((slot) => {
      const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(slot / 60), slot % 60);
      return slotDate >= advanceLimit;
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
    const { strategy, blocks, interval, serviceDuration, appointments, date, minAdvancedMinutes, allowPassiveTimeBooking } = params;

    let slots = this.generateSlotsFromBlocks({ strategy, blocks, interval, serviceDuration });
    slots = this.filterPastSlots({ slots, date });
    slots = this.filterOverlappingSlots({ slots, slotDuration: serviceDuration, appointments, allowPassiveTimeBooking });
    slots = this.filterByMinAdvancedMinutes({ slots, minAdvancedMinutes, date });

    return this.formatSlotsHumanReadble(slots);
  }
}
