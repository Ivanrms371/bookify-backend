import { Injectable } from '@nestjs/common';

@Injectable()
export class AvailabilityService {
  constructor() {}

  private resolveSlotInterval() {}

  private resolveMinAdvancedMinutes() {}

  private resolveMaxAdvancedDays() {}

  private canBookAt(): boolean {
    return true;
  }

  private isWithinAdvanceWindow() {}

  private getWorkingRangesForDate() {}

  private getBusyRanges() {}

  private generateSlots() {}

  private filterValidSlots() {}

  getAvailableSlots() {}
}
