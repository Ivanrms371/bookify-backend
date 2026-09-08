import { AvailableSlot } from './availability.types';

/**
 * Represents a time range in continuous minutes from local midnight (0 to 1440).
 * E.g., 09:00 = 540, 18:00 = 1080.
 * Simplifies intersection and subtraction operations as pure integers without timezone overhead.
 */
export interface TimeRange {
  opensAt: number;
  closesAt: number;
}

/**
 * UTC time block retrieved from the database (Appointments and AppointmentBlocks).
 */
export interface BusyIntervalUtc {
  startsAt: Date;
  endsAt: Date;
}

/**
 * Complete, decoupled payload consumed by the SlotsGenerator to process a single day.
 */
export interface GenerateSlotsContext {
  targetDate: string; // 'YYYY-MM-DD'
  timeZone: string; // IANA time zone (e.g., 'America/Montevideo')

  // Duration and interval rules
  serviceDuration: number;
  slotInterval: number;
  bufferMinutes: number;

  // Booking notice windows
  minAdvancedMinutes: number;
  maxAdvancedDays: number;

  // Working hours in local minutes (0 - 1440)
  workingHours: TimeRange[];

  // Exceptions
  isFullyClosed: boolean;
  exceptionBlocks: TimeRange[];

  // Database busy intervals to subtract
  busyIntervalsUtc: BusyIntervalUtc[];
}
