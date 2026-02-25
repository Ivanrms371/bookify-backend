/**
 * Returns a Date for tomorrow at the given hour and minute.
 */
export function tomorrow(hours: number, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Returns a Date `n` days from now.
 */
export function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Generates a random 6-character alphanumeric confirmation code.
 */
export function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
