/** An unavailable recipient channel is terminal, never an uncertain provider send. */
export class DeliverySkippedError extends Error {
  constructor(reason: string) {
    super(`SKIPPED: ${reason}`);
    this.name = 'DeliverySkippedError';
  }
}
