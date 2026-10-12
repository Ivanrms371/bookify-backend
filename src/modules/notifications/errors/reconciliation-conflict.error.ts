export class ReconciliationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReconciliationConflictError';
  }
}
