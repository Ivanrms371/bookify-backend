import { TenantOnboardingService } from './onboarding.service';
import type { TenantOnboardingRepository } from './onboarding.repository';
import type { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';
import type { PrismaService } from 'src/shared/prisma/prisma.service';

describe('onboarding confirmation', () => {
  const setup = (status = 'CONFIRM', claimed = true) => {
    const tx = {};
    const repo = { findByOwnerId: jest.fn().mockResolvedValue({ id: 'tenant', workspaceType: 'TEAM', onboardingStatus: status }), getStatus: jest.fn().mockResolvedValue({ id: 'tenant', onboardingStatus: 'COMPLETED', tenantWorkingHours: [], services: [] }), claimConfirmation: jest.fn().mockResolvedValue(claimed), completeOnboarding: jest.fn() };
    const subscriptions = { createTrialSubscription: jest.fn() };
    const prisma = { $transaction: jest.fn(async (callback) => callback(tx)) };
    return { tx, repo, subscriptions, prisma, service: new TenantOnboardingService(prisma as unknown as PrismaService, repo as unknown as TenantOnboardingRepository, subscriptions as unknown as SubscriptionsService) };
  };
  it('propagates the same transaction to completion and trial creation', async () => {
    const { service, repo, subscriptions, tx } = setup();
    await service.confirm('owner');
    expect(repo.completeOnboarding).toHaveBeenCalledWith('tenant', tx);
    expect(subscriptions.createTrialSubscription).toHaveBeenCalledWith('tenant', tx);
  });
  it('does not recreate trial/settings when confirmation is retried', async () => {
    const { service, subscriptions, prisma } = setup('COMPLETED');
    await service.confirm('owner');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(subscriptions.createTrialSubscription).not.toHaveBeenCalled();
  });
  it('does not create anything when a concurrent confirmation already claimed the tenant', async () => {
    const { service, repo, subscriptions } = setup('CONFIRM', false);
    await service.confirm('owner');
    expect(repo.completeOnboarding).not.toHaveBeenCalled();
    expect(subscriptions.createTrialSubscription).not.toHaveBeenCalled();
  });
  it('propagates trial failure so the surrounding transaction can roll back', async () => {
    const { service, subscriptions } = setup();
    subscriptions.createTrialSubscription.mockRejectedValue(new Error('trial failed'));
    await expect(service.confirm('owner')).rejects.toThrow('trial failed');
  });
  it('rejects confirmation before completing the preceding steps', async () => {
    await expect(setup('SERVICES').service.confirm('owner')).rejects.toThrow('Complete the onboarding steps');
  });
});
