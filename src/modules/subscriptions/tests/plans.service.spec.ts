import { PlansService } from '../plans.service';

describe('canonical catalog', () => {
  const service = new PlansService();
  it('uses existing prices, typed unconfigured service limits and no provider IDs', () => {
    const plans = service.getCatalog();
    expect(plans.map((p) => p.id)).toEqual(['free', 'pro', 'pro_plus']);
    expect(plans[1].pricing.MONTHLY.amount).toBe('14.99');
    expect(plans[2].limits).toEqual({ professionals: 5, services: { kind: 'not_configured' } });
    expect(JSON.stringify(plans)).not.toContain('lemonVariantId');
    expect(plans[0].pricing.ANNUAL).toBeUndefined();
  });
  it('assigns Pro+ to every new workspace trial', () => {
    expect(service.resolveTrialPlan().id).toBe('pro_plus');
  });
});
