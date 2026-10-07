import { Prisma } from 'src/generated/prisma/client';

export type TenantOnboardingRaw = Prisma.TenantGetPayload<{
  select: {
    onboardingStatus: true;
    id: true;
    workspaceType: true;
    name: true;
    slug: true;
    type: true;
    settings: { select: { currency: true; timeZone: true } };
    country: true;
    province: true;
    city: true;
    addressLine1: true;
    addressLine2: true;
    phoneNumber: true;

    logoUrl: true;
    coverUrl: true;
    colorTheme: true;
    logoPublicId: true;
    coverPublicId: true;
    onboardingProfessionalDraft: true;
    tenantWorkingHours: {
      select: {
        dayOfWeek: true;
        opensAt: true;
        closesAt: true;
      };
    };
    services: {
      select: {
        id: true;
        name: true;
        price: true;
        durationMinutes: true;
        imageUrl: true;
        imagePublicId: true;
      };
    };
  };
}>;
