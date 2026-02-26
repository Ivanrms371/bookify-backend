/**
 * Pure domain utility for building appointment time blocks.
 *
 * A service is divided into:
 *   1. Initial Active Block — staff is occupied (e.g., applying hair dye)
 *   2. Passive Time         — staff is FREE (e.g., dye processing)
 *   3. Final Active Block   — staff is occupied (e.g., washing, styling)
 *
 * Only active blocks generate AppointmentBlocks (staff is busy).
 * Passive time has NO block — the staff can attend other clients.
 *
 * If passiveTimeMinutes === 0, a single continuous block is created.
 */

export interface TimeBlock {
  startTime: Date;
  endTime: Date;
}

export interface BuildBlocksParams {
  startTime: Date;
  initialActiveMinutes: number;
  passiveTimeMinutes: number;
  finalActiveMinutes: number;
}

export function buildTimeBlocks(params: BuildBlocksParams): TimeBlock[] {
  const { startTime, initialActiveMinutes, passiveTimeMinutes, finalActiveMinutes } = params;
  const startMs = startTime.getTime();

  // No passive time → single continuous block
  if (passiveTimeMinutes === 0) {
    const totalDuration = initialActiveMinutes + finalActiveMinutes;
    return [
      {
        startTime,
        endTime: new Date(startMs + totalDuration * 60 * 1000),
      },
    ];
  }

  // With passive time → two active blocks, gap in between is free
  const initialEnd = new Date(startMs + initialActiveMinutes * 60 * 1000);
  const finalStart = new Date(startMs + (initialActiveMinutes + passiveTimeMinutes) * 60 * 1000);
  const finalEnd = new Date(startMs + (initialActiveMinutes + passiveTimeMinutes + finalActiveMinutes) * 60 * 1000);

  return [
    {
      startTime,
      endTime: initialEnd,
    },
    {
      startTime: finalStart,
      endTime: finalEnd,
    },
  ];
}
