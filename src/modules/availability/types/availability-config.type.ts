type WorkingHour = {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
};

type Settings = {
  slotIntervalMinutes: number;
  minAdvancedMinutes: number;
  maxAdvancedDays: number;
  timeZone: string;
};

export type AvailabilityConfigQuery = {
  tenant: {
    tenantWorkingHours: WorkingHour[];
    settings: Settings;
  };
  workingHours: WorkingHour[];
  slotIntervalMinutes: number;
  minAdvancedMinutes: number;
};

export type AvailabilityConfig = {
  workingHours: WorkingHour[];
  slotIntervalMinutes: number;
  minAdvancedMinutes: number;
  maxAdvancedDays: number;
  timeZone: string;
};
