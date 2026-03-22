export class OnboardingStatusMapper {
  static toDto(business: { id: string; subscription: { id: string } | null } | null) {
    if (!business) {
      return { step: 'setup', businessId: null };
    }
    if (!business.subscription) {
      return { step: 'plan', businessId: business.id };
    }
    return { step: 'complete', businessId: business.id };
  }
}
