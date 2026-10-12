import { TenantUsageService } from 'src/modules/tenants/features/usage/tenant-usage.service';
import { TenantUsageRepository } from 'src/modules/tenants/features/usage/tenant-usage.repository';

const service = new TenantUsageService(new TenantUsageRepository({} as never), {} as never);

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
    await expect(service.assertCanAddServices('tenant', 1, tx as never)).rejects.toThrow();
    expect(tx.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.subscription.findUnique.mock.invocationCallOrder[0]);
    expect(tx.service.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant', deletedAt: null } });
  });
  it('allows an addition up to the exact cap, including inactive resources in the count', async () => {
    const tx = setup(undefined, 9);
    await expect(service.assertCanAddServices('tenant', 1, tx as never)).resolves.toBeUndefined();
  });
  it('blocks a bulk addition exceeding remaining capacity', async () => {
    await expect(service.assertCanAddServices('tenant', 2, setup(undefined, 9) as never)).rejects.toThrow();
  });
  it.each([
    { planChangesAt: null, planChangeUndoRequestedAt: null },
    { planChangesAt: new Date(), planChangeUndoRequestedAt: null },
    { planChangesAt: new Date(), planChangeUndoRequestedAt: new Date() },
  ])('keeps Free caps during pending transition %j', async (intent) => {
    const tx = setup({ planId: 'pro', pendingPlanId: 'free', deletedAt: null, ...intent }, 1);
    await expect(service.assertCanAddProfessional('tenant', tx as never)).rejects.toThrow();
  });
  it('does not impose Free caps on a paid plan with no Free intent', async () => {
    const tx = setup({ planId: 'pro', pendingPlanId: null, deletedAt: null }, 30);
    await expect(service.assertCanAddServices('tenant', 1, tx as never)).resolves.toBeUndefined();
    expect(tx.service.count).not.toHaveBeenCalled();
  });
});

it('preserves the plan-limit error response', async () => {
  const tx = setup(undefined, 10);
  try {
    await service.assertCanAddServices('tenant', 1, tx as never);
    throw new Error('Expected a plan-limit failure');
  } catch (error) {
    expect(error.getStatus()).toBe(409);
    expect(error.getResponse()).toMatchObject({ code: 'PLAN_LIMIT_REACHED', resource: 'services', used: 10, limit: 10 });
  }
});

it.each([null, { planId: 'free', pendingPlanId: null, deletedAt: new Date() }])(
  'does not add restrictions for missing/deleted subscription %j',
  async (subscription) => {
    const tx = setup();
    tx.subscription.findUnique.mockResolvedValue(subscription);
    await expect(service.assertCanAddServices('tenant', 100, tx as never)).resolves.toBeUndefined();
    expect(tx.service.count).not.toHaveBeenCalled();
  },
);
