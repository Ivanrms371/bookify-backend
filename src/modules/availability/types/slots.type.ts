// Base domain blocks

export type Block = {
  startMinutes: number;
  endMinutes: number;
};

export type AppointmentBlock = {
  startMinutes: number;
  endMinutes: number;
  passive: boolean;
};

// Appointment domain

export type Appointment = {
  startTime: Date;
  endTime: Date;

  durationMinutes: number;
  initialActiveMinutes: number;
  passiveMinutes: number;
  finalActiveMinutes: number;
};

// Strategies

export type SlotStrategy = 'dynamic' | 'slot';

//  Orchestrator layer

export type GenerateParams = {
  strategy: SlotStrategy;
  blocks: Block[];
  interval: number;
  serviceDuration: number;
  appointments: Appointment[];
  date: Date;
  minAdvancedMinutes: number;
  allowPassiveTimeBooking: boolean;
};

// Slot generation layer

export type GenerateSlotsFromBlocksParams = {
  strategy: SlotStrategy;
  blocks: Block[];
  interval: number;
  serviceDuration: number;
};

export type GenerateDynamicSlotsParams = {
  blocks: Block[];
  serviceDuration: number;
};

export type GenerateFixedSlotsParams = {
  blocks: Block[];
  interval: number;
};

// Filter Layer

export type FilterPastSlotsParams = {
  slots: number[];
  date: Date;
};

export type FilterByMinAdvancedMinutesParams = {
  slots: number[];
  minAdvancedMinutes: number;
  date: Date;
};

export type FilterOverlappingSlotsParams = {
  slots: number[];
  slotDuration: number;
  appointments: Appointment[];
  allowPassiveTimeBooking: boolean;
};

export type IsSlotOverlappingParams = {
  slot: number;
  slotDuration: number;
  appointment: Appointment;
  allowPassiveTimeBooking: boolean;
};

// Internal helpers

export type GetAppointmentBlocksParams = {
  appointment: Appointment;
  allowPassiveTimeBooking: boolean;
};
