import { UserGetPayload, UserSelect } from 'src/generated/prisma/models';

export const userMeSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  memberships: {
    where: {
      status: 'ACTIVE' as const,
      tenant: { deletedAt: null },
    },
    select: {
      role: true,
      status: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          isActive: true,
          workspaceType: true,
          onboardingStatus: true,
          subscription: {
            select: {
              plan: {
                select: {
                  name: true,
                },
              },
              status: true,
              trialEndsAt: true,
              currentPeriodEnd: true,
              cancelledAt: true,
              nextPaymentDate: true,
            },
          },
        },
      },
    },
  },
} satisfies UserSelect;

// tipo inferido directamente de Prisma — nunca se desincroniza
export type UserMeRaw = UserGetPayload<{ select: typeof userMeSelect }>;
