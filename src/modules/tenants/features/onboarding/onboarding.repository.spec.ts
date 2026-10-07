import { TenantOnboardingRepository } from './onboarding.repository';
import type { PrismaService } from 'src/shared/prisma/prisma.service';
import type { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

const fixture = () => {
  const prisma = { tenant: { findFirst: jest.fn(), findFirstOrThrow: jest.fn(), update: jest.fn() } };
  return { prisma, repo: new TenantOnboardingRepository(prisma as unknown as PrismaService) };
};
describe('onboarding location persistence', () => {
  it('looks up only a selected non-deleted tenant with an active OWNER membership', async () => {
    const { prisma, repo } = fixture();
    await repo.findByOwnerId('owner', 'selected');
    expect(prisma.tenant.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'selected',
        deletedAt: null,
        memberships: { some: { userId: 'owner', role: 'OWNER', isActive: true } },
      },
    });
  });
  it('reloads the selected owned tenant including the studio fields', async () => {
    const { prisma, repo } = fixture();
    await repo.getStatus('owner', 'selected');
    expect(prisma.tenant.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'selected', deletedAt: null, memberships: { some: { userId: 'owner', role: 'OWNER', isActive: true } } },
        select: expect.objectContaining({
          country: true,
          province: true,
          city: true,
          addressLine1: true,
          addressLine2: true,
          phoneNumber: true,
        }),
      }),
    );
  });
  it('creates country-derived settings through the confirmation transaction, not the root client', async () => {
    const { prisma, repo } = fixture();
    const tx = { tenant: { update: jest.fn() } };
    await repo.completeOnboarding('selected', tx as unknown as TransactionClient, {
      currency: 'ARS',
      timeZone: 'America/Argentina/Cordoba',
    });
    expect(tx.tenant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'selected' },
        data: expect.objectContaining({
          settings: {
            upsert: {
              create: { currency: 'ARS', timeZone: 'America/Argentina/Cordoba' },
              update: { currency: 'ARS', timeZone: 'America/Argentina/Cordoba' },
            },
          },
        }),
      }),
    );
    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });
});
