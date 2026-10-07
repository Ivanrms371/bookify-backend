import { verifyFreeResourceAddition } from '../utils/free-plan-limits';

function setup(subscription = { planId: 'free', pendingPlanId: null as string | null, deletedAt: null }, used = 10) {
  const tx = {
    $executeRaw: jest.fn(),
    subscription: { findUnique: jest.fn().mockResolvedValue(subscription) },
    service: { count: jest.fn().mockResolvedValue(used) },
    professional: { count: jest.fn().mockResolvedValue(used) },
  };
  return tx;
}
describe('Free resource limits', () => {
  it('locks before reading usage and blocks additions at the service cap', async () => {
    const tx = setup();
    await expect(verifyFreeResourceAddition(tx as never, 'tenant', 'services')).rejects.toThrow();
    expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.subscription.findUnique.mock.invocationCallOrder[0]);
    expect(tx.service.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant', deletedAt: null } });
  });
  it('allows an addition up to the exact cap, including inactive resources in the count', async () => {
    const tx = setup(undefined, 9);
    await expect(verifyFreeResourceAddition(tx as never, 'tenant', 'services')).resolves.toBeUndefined();
  });
  it('blocks a bulk addition exceeding remaining capacity', async () => {
    await expect(verifyFreeResourceAddition(setup(undefined, 9) as never, 'tenant', 'services', 2)).rejects.toThrow();
  });
  it.each([
    { planChangesAt: null, planChangeUndoRequestedAt: null },
    { planChangesAt: new Date(), planChangeUndoRequestedAt: null },
    { planChangesAt: new Date(), planChangeUndoRequestedAt: new Date() },
  ])('keeps Free caps during pending transition %j', async (intent) => {
    const tx = setup({ planId: 'pro', pendingPlanId: 'free', deletedAt: null, ...intent }, 1);
    await expect(verifyFreeResourceAddition(tx as never, 'tenant', 'professionals')).rejects.toThrow();
  });
  it('does not impose Free caps on a paid plan with no Free intent', async () => {
    const tx = setup({ planId: 'pro', pendingPlanId: null, deletedAt: null }, 30);
    await expect(verifyFreeResourceAddition(tx as never, 'tenant', 'services')).resolves.toBeUndefined();
    expect(tx.service.count).not.toHaveBeenCalled();
  });
});
