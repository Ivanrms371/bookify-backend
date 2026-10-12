export class SimulatedDeliveryError extends Error {
  constructor() {
    super('SIMULATED: WhatsApp payload logged; no external message sent');
  }
}
