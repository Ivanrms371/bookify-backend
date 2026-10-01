// src/availability/interfaces/availability.interfaces.ts

export type DayAvailabilityReason =
  | 'AVAILABLE' // Has available slots
  | 'BUSINESS_CLOSED' // The shop closes this day
  | 'PROFESSIONAL_OFF' // The professional is not available today.
  | 'SCHEDULE_EXCEPTION' // Holiday, vacation or administrative block
  | 'OUT_OF_ADVANCED_RANGE' // Outside of maxAdvancedDays / minAdvancedMinutes
  | 'FULLY_BOOKED'; // It's open, but all the slots are taken.

export interface AvailableSlot {
  time: string; // '09:30' (For UI)
  startsAt: string; // '2026-09-06T12:30:00.000Z' (ISO UTC)
  endsAt: string; // '2026-09-06T13:15:00.000Z' (ISO UTC)
}

export type AppointmentAvailabilitySlotStatus = 'available' | 'busy' | 'past';

export interface AppointmentAvailabilitySlot extends AvailableSlot {
  status: AppointmentAvailabilitySlotStatus;
}

export interface DaySlotsSummary {
  date: string; // 'YYYY-MM-DD'
  hasAvailability: boolean; // slots.length > 0
  reason: DayAvailabilityReason;
  message?: string; // Description if is SCHEDULE_EXCEPTION
  slots: AvailableSlot[]; // Available Slots of day
}

export interface DayAvailabilityResponse {
  date: string;
  isAvailable: boolean;
  reason?: DayAvailabilityReason;
  slots: AvailableSlot[];
  nextAvailable?: {
    date: string;
    slots: AvailableSlot[];
  } | null;
}

export interface DateRangeResolutionResult {
  timeZone: string;
  days: DaySlotsSummary[];
}

export interface GetDayAvailabilityParams {
  tenantId: string;
  professionalId: string;
  serviceId: string;
  date: string; // 'YYYY-MM-DD'
}

export interface DayAppointmentAvailabilitySummary {
  date: string;
  hasAvailability: boolean;
  reason: DayAvailabilityReason;
  message?: string;
  slots: AppointmentAvailabilitySlot[];
}

export interface GetAppointmentAvailabilityParams {
  excludeAppointmentId?: string;
  tenantId: string;
  professionalId: string;
  serviceId: string;
  startDate: string;
  endDate?: string;
}

export interface AppointmentAvailabilityResponse {
  timeZone: string;
  days: DayAppointmentAvailabilitySummary[];
}

export type DayOverviewStatus = 'AVAILABLE' | 'SATURATED' | 'EMPTY' | 'CLOSED';

export interface DayOverviewItem {
  date: string; // 'YYYY-MM-DD'
  status: DayOverviewStatus;
  availableCount: number;
  reason?: string;
}

export interface GetAvailabilityOverviewParams {
  tenantId: string;
  professionalId: string;
  serviceId: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  saturationThreshold?: number; // Default: 3
}

export interface AvailabilityOverviewResponse {
  timeZone: string;
  days: Record<string, DayOverviewItem>;
}

export interface ValidateSlotAvailabilityParams {
  tenantId: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  ignoreMinAdvanced?: boolean;
  allowPast?: boolean;
  excludeAppointmentId?: string;
}

export interface ValidateSlotResponse {
  available: boolean;
}
