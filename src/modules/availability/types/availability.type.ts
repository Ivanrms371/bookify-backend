type WorkingBlock = {
  startMinutes: number;
  endMinutes: number;
};

type Exception = {
  isClosed: boolean;
  blocks: Block[];
};

type Block = {
  startMinutes: number;
  endMinutes: number;
};

export type ResolveScheduleParams = {
  workingBlocks: WorkingBlock[];
  scheduleException: Exception;
};

export type ResolvedSchedule = {
  startMinutes: number;
  endMinutes: number;
};
