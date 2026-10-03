import { PlansService } from '../plans.service';

describe('canonical catalog', () => {
  const service = new PlansService();
  it('uses existing prices, approved resource limits and no provider IDs', () => {
    const plans = service.getCatalog();
    expect(plans.map((p) => p.id)).toEqual(['free', 'pro', 'pro_plus']);
    expect(plans[1].pricing.MONTHLY.amount).toBe('14.99');
    expect(plans.map((plan) => plan.limits)).toEqual([
      { professionals: 1, services: 10 },
      { professionals: 3, services: 30 },
      { professionals: 8, services: 60 },
    ]);
    expect(JSON.stringify(plans)).not.toContain('lemonVariantId');
    expect(plans[0].pricing.ANNUAL).toBeUndefined();
  });
  it('assigns Pro+ to every new workspace trial', () => {
    expect(service.resolveTrialPlan().id).toBe('pro_plus');
  });
});
