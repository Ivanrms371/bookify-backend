import type { AppointmentMutationContext } from '../stats/types/appointment-stats.types';

export const mutationTx = {};
export function mutationFixture(emit: (name: string, payload: unknown) => void = () => {}) {
  return {
    mutate: async (_tenantId: string, operation: (context: AppointmentMutationContext) => Promise<unknown>) => {
      const events: { name: string; payload: unknown }[] = [];
      const result = await operation({ tx: mutationTx as never, afterCommit: (name, payload) => events.push({ name, payload }) });
      events.forEach((event) => emit(event.name, event.payload));
      return result;
    },
  };
}
