import { Prisma } from 'src/generated/prisma/client';

export type TenantOnboardingRaw = Prisma.TenantGetPayload<{
  select: {
    onboardingStatus: true;
    id: true;
    workspaceType: true;
    name: true;
    slug: true;
    type: true;
    logoUrl: true;
    coverUrl: true;
    colorTheme: true;
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
      };
    };
  };
}>;

export type TenantOnboardingResponse = {
  steps: [
    {
      id: string;
      label: string;
      completed: boolean;
    },
  ];
  onboardingStatus: string;
  savedData: {
    workspaceType: string;
    name: string;
    slug: string;
    type: string;
    logoUrl: string;
    coverUrl: string;
    colorTheme: string;
    workingHours: {
      dayOfWeek: number;
      opensAt: number;
      closesAt: number;
    };
    services: {
      id: string;
      name: string;
      price: number;
      durationMinutes: number;
    }[];
  };
};
