export interface AppointmentCreationParams {
  staffId: string;
  serviceId: string;
  date: Date;
}

export interface AvailabilityAppointmentBlock {
  startTime: Date;
  endTime: Date;
}

export interface AvailabilityAppointment {
  blocks: AvailabilityAppointmentBlock[];
}

export interface AvailabilityData {
  business: {
    settings: Settings | null;
  };
  workingHours: Block[];
  exceptions: Exception[];
  appointments: AvailabilityAppointment[];
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
