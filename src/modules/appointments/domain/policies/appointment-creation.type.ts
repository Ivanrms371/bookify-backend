export interface AppointmentCreationParams {
  staffId: string;
  serviceId: string;
  date: Date;
}

export interface AvailabilityData {
  business: {
    settings: Settings | null;
  };
  workingHours: Block[];
  exceptions: Exception[];
  appointments: Appointment[];
}

export interface Settings {
  allowPassiveTimeBooking: boolean;
  bufferTimeMinutes: number;
  maxAdvancedDays: number;
  minAdvancedMinutes: number;
  slotIntervalMinutes: number;
}

export interface Exception {
  blocks: Block[];
  isClosed: boolean;
}

export interface Appointment {
  startTime: Date;
  durationMinutes: number;
  finalActiveMinutes: number;
  initialActiveMinutes: number;
  passiveMinutes: number;
  endTime: Date;
}

export interface Service {
  initialActiveMinutes: number;
  passiveTimeMinutes: number;
  finalActiveMinutes: number;
  durationMinutes: number;
}

export interface Block {
  startMinutes: number;
  endMinutes: number;
}
