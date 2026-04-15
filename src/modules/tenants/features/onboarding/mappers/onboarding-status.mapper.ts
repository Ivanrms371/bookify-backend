export class OnboardingStatusMapper {
  static toDto(tenant: { id: string; subscription: { id: string } | null } | null) {
    if (!tenant) {
      return { step: 'setup', tenantId: null };
    }
    if (!tenant.subscription) {
      return { step: 'plan', tenantId: tenant.id };
    }
    return { step: 'complete', tenantId: tenant.id };
  }
}
