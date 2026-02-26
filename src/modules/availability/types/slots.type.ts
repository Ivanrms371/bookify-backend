// Base domain blocks

export type Block = {
  startMinutes: number;
  endMinutes: number;
};

// AppointmentBlock fetched from DB

export type FetchedAppointmentBlock = {
  staffId: string;
  startTime: Date;
  endTime: Date;
};

// Strategies

export type SlotStrategy = 'dynamic' | 'slot';

//  Orchestrator layer

export type GenerateParams = {
  strategy: SlotStrategy;
  blocks: Block[];
  interval: number;
  serviceDuration: number;
  appointmentBlocks: FetchedAppointmentBlock[];
  date: Date;
  minAdvancedMinutes: number;
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
  appointmentBlocks: FetchedAppointmentBlock[];
  date: Date;
};

export type IsSlotOverlappingParams = {
  slot: number;
  slotDuration: number;
  block: FetchedAppointmentBlock;
  date: Date;
};
