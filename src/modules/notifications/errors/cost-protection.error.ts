export class CostProtectionError extends Error {
  constructor() {
    super('COST_PROTECTION');
    this.name = 'CostProtectionError';
  }
}
