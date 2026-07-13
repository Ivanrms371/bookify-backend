/**
 * Pure domain utility for building appointment time blocks.
 *
 * Services are now a single continuous block.
 */

export interface TimeBlock {
  startTime: Date;
  endTime: Date;
}

export interface BuildBlocksParams {
  startTime: Date;
  durationMinutes: number;
}

export function buildTimeBlocks(params: BuildBlocksParams): TimeBlock[] {
  const { startTime, durationMinutes } = params;
  const startMs = startTime.getTime();

  return [
    {
      startTime,
      endTime: new Date(startMs + durationMinutes * 60 * 1000),
    },
  ];
}
