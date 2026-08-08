export type ValidateHoursRangeParams = {
  isClosed: boolean;
  blocks: Block[];
};

type Block = {
  startAt: string;
  endAt: string;
};

export type ValidateOverlapParams = {
  professionalId: string;
  startDate: Date;
  endDate: Date;
  daysOfWeek?: number[];
  excludeId?: string;
};
