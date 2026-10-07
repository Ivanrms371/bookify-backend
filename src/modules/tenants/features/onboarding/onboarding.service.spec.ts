import { TenantOnboardingService } from './onboarding.service';
import type { TenantOnboardingRepository } from './onboarding.repository';
import type { SubscriptionsService } from 'src/modules/subscriptions/subscriptions.service';
import type { PrismaService } from 'src/shared/prisma/prisma.service';
import type { ProfessionalDraft } from './types/professional-draft.types';
import { OnboardingStepMapper } from './mappers/onboarding-step.mapper';

const profile: ProfessionalDraft = {
  attendsClients: true,
  name: 'Owner',
  email: 'owner@example.com',
  phoneCountryCode: '+598',
  phoneNumber: '99123456',
  serviceIds: ['service'],
};
const setup = (status = 'CONFIRM', draft: ProfessionalDraft | null = { attendsClients: false }) => {
  const tenant = {
    country: 'UY',
    province: 'Montevideo',
    city: 'Montevideo',
    addressLine1: '18 de Julio 1234',
    id: 'tenant',
    workspaceType: 'TEAM',
    onboardingStatus: status,
    onboardingProfessionalDraft: draft,
  };
  const tx = {
    service: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([{ id: 'service' }]),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    professional: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: 'professional' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ avatarUrl: 'avatar' }) },
    serviceAssignment: { deleteMany: jest.fn(), createMany: jest.fn() },
  };
  const repo = {
    findByOwnerId: jest.fn().mockResolvedValue(tenant),
    lockTenant: jest.fn().mockResolvedValue(tenant),
    lockOwner: jest.fn(),
    getStatus: jest.fn().mockResolvedValue({ ...tenant, tenantWorkingHours: [], services: [] }),
    claimConfirmation: jest.fn().mockResolvedValue(true),
    completeOnboarding: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    replaceSchedules: jest.fn(),
    createInitialTenant: jest.fn(),
    findBySlug: jest.fn().mockResolvedValue(null),
  };
  const subscriptions = {
    createTrialSubscription: jest.fn(),
    getTrialDetails: jest.fn().mockReturnValue({ planName: 'Pro+', durationDays: 14 }),
  };
  const prisma = { $transaction: jest.fn(async (callback) => callback(tx)) };
  const service = new TenantOnboardingService(
    prisma as unknown as PrismaService,
    repo as unknown as TenantOnboardingRepository,
    subscriptions as unknown as SubscriptionsService,
  );
  return { tenant, tx, repo, subscriptions, prisma, service };
};

describe('business-first onboarding', () => {
  it('returns seven steps in the same order for every workspace', async () => {
    const { service } = setup('BUSINESS_DETAILS');
    const result = await service.getStatus('owner');
    expect(result.steps.map((step) => step.id)).toEqual([
      'BUSINESS_DETAILS',
      'LOCATION',
      'SERVICES',
      'SCHEDULE',
      'PROFESSIONAL_PROFILE',
      'CUSTOMIZE',
      'CONFIRM',
    ]);
    expect(result.trial).toEqual({ planName: 'Pro+', durationDays: 14 });
    expect(OnboardingStepMapper.forStatus('COMPLETED').every((step) => step.status === 'COMPLETED')).toBe(true);
  });
  it('initializes missing tenants and retains existing tenants', async () => {
    const { service, repo } = setup('BUSINESS_DETAILS');
    await service.initalize('owner');
    expect(repo.createInitialTenant).not.toHaveBeenCalled();
    repo.findByOwnerId.mockResolvedValueOnce(null);
    await service.initalize('owner');
    expect(repo.createInitialTenant).toHaveBeenCalledWith('owner');
  });
  it('blocks jumping ahead and editing completed onboarding', async () => {
    await expect(setup('BUSINESS_DETAILS').service.updateProfessional('owner', { attendsClients: false })).rejects.toThrow(
      'previous onboarding steps',
    );
    await expect(setup('COMPLETED').service.updateCustomize('owner', {})).rejects.toThrow('previous onboarding steps');
  });
  it('stores a manager-only choice and advances without creating a professional', async () => {
    const { service, repo, tx } = setup('PROFESSIONAL_PROFILE');
    await service.updateProfessional('owner', { attendsClients: false });
    expect(repo.update).toHaveBeenCalledWith('tenant', { onboardingProfessionalDraft: { attendsClients: false } }, tx);
    expect(repo.updateStatus).toHaveBeenCalledWith('tenant', 'CUSTOMIZE', tx);
    expect(tx.professional.upsert).not.toHaveBeenCalled();
  });
  it('saves the actual linked profile and assignments on its step, inactive until confirmation', async () => {
    const { service, repo, tx } = setup('PROFESSIONAL_PROFILE');
    await service.updateProfessional('owner', profile);
    expect(repo.update).toHaveBeenCalledWith('tenant', { onboardingProfessionalDraft: profile }, tx);
    expect(tx.professional.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'owner' },
        create: expect.objectContaining({ userId: 'owner', tenantId: 'tenant', name: 'Owner', isActive: false }),
        update: expect.objectContaining({ name: 'Owner', isActive: false }),
      }),
    );
    expect(tx.serviceAssignment.createMany).toHaveBeenCalledWith({
      data: [{ professionalId: 'professional', serviceId: 'service', isActive: true }],
    });
    expect(repo.updateStatus).toHaveBeenCalledWith('tenant', 'CUSTOMIZE', tx);
  });
  it('rejects an incomplete professional draft', async () => {
    await expect(setup('PROFESSIONAL_PROFILE').service.updateProfessional('owner', { attendsClients: true })).rejects.toThrow('Completá');
  });
  it('rejects foreign or removed services without saving', async () => {
    const { service, repo, tx } = setup('PROFESSIONAL_PROFILE');
    tx.service.count.mockResolvedValue(0);
    await expect(service.updateProfessional('owner', profile)).rejects.toThrow('servicios seleccionados cambiaron');
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('retains service IDs when editing an earlier step', async () => {
    const { service, tx, repo } = setup('CONFIRM', profile);
    await service.updateServices('owner', { services: [{ id: 'service', name: 'Cut', durationMinutes: 30, price: 10 as never }] });
    expect(tx.service.update).toHaveBeenCalledWith({
      where: { id: 'service', tenantId: 'tenant' },
      data: { name: 'Cut', durationMinutes: 30, price: 10 },
    });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });
  it('rejects service IDs from another tenant before deleting any services', async () => {
    const { service, tx } = setup('SERVICES');
    await expect(
      service.updateServices('owner', { services: [{ id: 'foreign', name: 'Cut', durationMinutes: 30, price: 10 as never }] }),
    ).rejects.toThrow('servicios');
    expect(tx.service.deleteMany).not.toHaveBeenCalled();
  });
  it.each([
    { name: '', price: 1, durationMinutes: 30 },
    { name: 'Cut', price: -1, durationMinutes: 30 },
    { name: 'Cut', price: 1, durationMinutes: 0 },
  ])('rejects invalid service setup: %s', async (value) => {
    const { service, tx } = setup('SERVICES');
    await expect(service.updateServices('owner', { services: [value as never] })).rejects.toThrow('precio válido');
    expect(tx.service.deleteMany).not.toHaveBeenCalled();
  });
  it('allows a free service with a positive duration', async () => {
    const { service, tx } = setup('SERVICES');
    await service.updateServices('owner', { services: [{ name: 'Consultation', price: 0 as never, durationMinutes: 30 }] });
    expect(tx.service.create).toHaveBeenCalledWith({ data: { name: 'Consultation', price: 0, durationMinutes: 30, tenantId: 'tenant' } });
  });
  it('saves service images and custom durations when creating and editing', async () => {
    const { service, tx } = setup('SERVICES');
    const values = {
      name: 'Cut',
      price: 10 as never,
      durationMinutes: 22,
      imageUrl: 'https://example.com/service.jpg',
      imagePublicId: 'services/cut',
    };
    await service.updateServices('owner', { services: [values, { ...values, id: 'service' }] });
    expect(tx.service.create).toHaveBeenCalledWith({ data: { ...values, tenantId: 'tenant' } });
    expect(tx.service.update).toHaveBeenCalledWith({ where: { id: 'service', tenantId: 'tenant' }, data: values });
  });
  it('skip customization preserves saved values and advances', async () => {
    const { service, repo, tx } = setup('CUSTOMIZE');
    await service.updateCustomize('owner', {});
    expect(repo.update).toHaveBeenCalledWith(
      'tenant',
      { logoUrl: undefined, logoPublicId: undefined, coverUrl: undefined, coverPublicId: undefined, colorTheme: undefined },
      tx,
    );
    expect(repo.updateStatus).toHaveBeenCalledWith('tenant', 'CONFIRM', tx);
  });
  it('stores image identifiers, removals and color', async () => {
    const { service, repo, tx } = setup('CUSTOMIZE');
    await service.updateCustomize('owner', {
      logoUrl: 'logo',
      logoPublicId: 'logo-id',
      coverUrl: null,
      coverPublicId: null,
      colorTheme: '#123456',
    });
    expect(repo.update).toHaveBeenCalledWith(
      'tenant',
      { logoUrl: 'logo', logoPublicId: 'logo-id', coverUrl: null, coverPublicId: null, colorTheme: '#123456' },
      tx,
    );
  });
});

describe('onboarding confirmation', () => {
  it('activates the saved professional and creates the trial in the completion transaction', async () => {
    const { service, repo, subscriptions, tx } = setup('CONFIRM', profile);
    await service.confirm('owner');
    expect(repo.completeOnboarding).toHaveBeenCalledWith('tenant', tx, { currency: 'UYU', timeZone: 'America/Montevideo' });
    expect(subscriptions.createTrialSubscription).toHaveBeenCalledWith('tenant', tx);
    expect(tx.professional.updateMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant', userId: 'owner', deletedAt: null },
      data: { isActive: true },
    });
    expect(tx.professional.upsert).not.toHaveBeenCalled();
    expect(tx.serviceAssignment.createMany).not.toHaveBeenCalled();
  });
  it('rejects activation when the saved professional is missing', async () => {
    const { service, tx, repo } = setup('CONFIRM', profile);
    tx.professional.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.confirm('owner')).rejects.toThrow('Elegí');
    expect(repo.completeOnboarding).not.toHaveBeenCalled();
  });
  it('does not create a professional for a manager-only owner', async () => {
    const { service, tx, subscriptions } = setup();
    await service.confirm('owner');
    expect(tx.professional.upsert).not.toHaveBeenCalled();
    expect(subscriptions.createTrialSubscription).toHaveBeenCalledTimes(1);
  });
  it('does not recreate trial/settings when retried after completion', async () => {
    const { service, subscriptions, prisma } = setup('COMPLETED');
    await service.confirm('owner');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(subscriptions.createTrialSubscription).not.toHaveBeenCalled();
  });
  it('does not create anything after a concurrent confirmation completes', async () => {
    const { service, repo, subscriptions } = setup();
    repo.lockTenant.mockResolvedValue({ ...setup().tenant, onboardingStatus: 'COMPLETED' });
    await service.confirm('owner');
    expect(repo.completeOnboarding).not.toHaveBeenCalled();
    expect(subscriptions.createTrialSubscription).not.toHaveBeenCalled();
  });
  it('does not create anything if confirmation was already claimed', async () => {
    const { service, repo, subscriptions } = setup();
    repo.claimConfirmation.mockResolvedValue(false);
    await service.confirm('owner');
    expect(repo.completeOnboarding).not.toHaveBeenCalled();
    expect(subscriptions.createTrialSubscription).not.toHaveBeenCalled();
  });
  it('propagates trial failure so the transaction can roll back', async () => {
    const { service, subscriptions } = setup('CONFIRM', profile);
    subscriptions.createTrialSubscription.mockRejectedValue(new Error('trial failed'));
    await expect(service.confirm('owner')).rejects.toThrow('trial failed');
  });
  it('rejects confirmation before finishing the preceding steps', async () => {
    await expect(setup('SERVICES').service.confirm('owner')).rejects.toThrow('Complete the onboarding steps');
  });
  it('requires an explicit attendance choice', async () => {
    await expect(setup('CONFIRM', null).service.confirm('owner')).rejects.toThrow('Elegí');
  });
  it('revalidates removed services before claiming confirmation', async () => {
    const { service, tx, repo } = setup('CONFIRM', profile);
    tx.service.count.mockResolvedValue(0);
    await expect(service.confirm('owner')).rejects.toThrow('servicios');
    expect(repo.claimConfirmation).not.toHaveBeenCalled();
  });
  it.each([
    { tenantId: 'other', deletedAt: null },
    { tenantId: 'tenant', deletedAt: new Date() },
  ])('rejects an incompatible linked profile: %s', async (existing) => {
    const { service, tx, repo } = setup('CONFIRM', profile);
    tx.professional.findUnique.mockResolvedValue(existing as never);
    await expect(service.confirm('owner')).rejects.toThrow('vincularlo');
    expect(repo.claimConfirmation).not.toHaveBeenCalled();
  });
  it('reuses an existing profile in this tenant when saving the profile step', async () => {
    const { service, tx } = setup('PROFESSIONAL_PROFILE', profile);
    tx.professional.findUnique.mockResolvedValue({ tenantId: 'tenant', deletedAt: null } as never);
    await service.updateProfessional('owner', profile);
    expect(tx.professional.upsert).toHaveBeenCalledTimes(1);
  });
});

describe('onboarding studio location', () => {
  const dto = { country: 'AR', province: 'Córdoba', city: 'Córdoba', addressLine1: 'San Martín 123' };
  it('saves studio fields under the owned tenant lock without advancing services or changing the professional', async () => {
    const { service, repo, tx } = setup('SERVICES');
    await service.updateLocation('owner', 'tenant', { ...dto, addressLine2: 'Piso 2', phoneNumber: '+54 351 1234567' });
    expect(repo.findByOwnerId).toHaveBeenCalledWith('owner', 'tenant');
    expect(repo.lockTenant).toHaveBeenCalledWith('tenant', tx);
    expect(repo.update).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({ ...dto, addressLine2: 'Piso 2', phoneNumber: '+54 351 1234567' }),
      tx,
    );
    expect(repo.updateStatus).not.toHaveBeenCalled();
    expect(tx.professional.upsert).not.toHaveBeenCalled();
    expect(repo.getStatus).toHaveBeenCalledWith('owner', 'tenant');
  });
  it('rejects a region from another country without saving', async () => {
    const { service, repo } = setup('SERVICES');
    await expect(service.updateLocation('owner', 'tenant', { ...dto, country: 'UY' })).rejects.toThrow('país elegido');
    expect(repo.update).not.toHaveBeenCalled();
  });
  it.each(['BUSINESS_DETAILS', 'COMPLETED'])('rejects location writes at %s', async (status) => {
    const { service, repo } = setup(status);
    await expect(service.updateLocation('owner', 'tenant', dto)).rejects.toThrow('previous onboarding steps');
    expect(repo.update).not.toHaveBeenCalled();
  });
  it('rejects a tenant not owned by the caller before opening a write transaction', async () => {
    const { service, repo, prisma } = setup('SERVICES');
    repo.findByOwnerId.mockResolvedValue(null);
    await expect(service.updateLocation('owner', 'other', dto)).rejects.toThrow('Tenant not found');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('retains omitted optional fields and supports explicit removal', async () => {
    const { service, repo } = setup('SERVICES');
    await service.updateLocation('owner', 'tenant', dto);
    expect(repo.update.mock.calls[0][1]).not.toHaveProperty('phoneNumber');
    expect(repo.update.mock.calls[0][1]).not.toHaveProperty('addressLine2');
    await service.updateLocation('owner', 'tenant', { ...dto, phoneNumber: null, addressLine2: null });
    expect(repo.update.mock.calls[1][1]).toMatchObject({ phoneNumber: null, addressLine2: null });
  });
  it('returns address and resolved defaults on reload', async () => {
    const { service, repo, tenant } = setup('SERVICES');
    repo.getStatus.mockResolvedValue({ ...tenant, ...dto, addressLine2: null, phoneNumber: null, tenantWorkingHours: [], services: [] });
    const result = await service.getStatus('owner');
    expect(result.savedData).toMatchObject({ ...dto, currency: 'ARS', timeZone: 'America/Argentina/Cordoba' });
  });
  it('uses saved country/province under the confirmation lock for settings creation', async () => {
    const { service, repo, tx, tenant } = setup();
    repo.lockTenant.mockResolvedValue({ ...tenant, country: 'AR', province: 'Mendoza' });
    await service.confirm('owner');
    expect(repo.completeOnboarding).toHaveBeenCalledWith('tenant', tx, { currency: 'ARS', timeZone: 'America/Argentina/Mendoza' });
  });
});

describe('separate address onboarding step', () => {
  it('saves business details only and advances to address', async () => {
    const { service, repo, tx } = setup('BUSINESS_DETAILS');
    await service.updateBusiness('owner', { name: 'Studio', type: 'OTHER' as never });
    expect(repo.update).toHaveBeenCalledWith('tenant', { name: 'Studio', slug: 'studio', type: 'OTHER' }, tx);
    expect(repo.updateStatus).toHaveBeenCalledWith('tenant', 'LOCATION', tx);
  });
  it('saves address and derived preferences before advancing to services', async () => {
    const { service, repo, tx } = setup('LOCATION');
    await service.updateLocation('owner', 'tenant', {
      country: 'PE',
      currency: 'USD',
      timeZone: 'America/Montevideo',
      province: 'Lima',
      city: 'Lima',
      addressLine1: 'Calle 123',
    });
    expect(repo.update).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({
        country: 'PE',
        settings: {
          upsert: {
            create: { currency: 'PEN', timeZone: 'America/Lima' },
            update: { currency: 'PEN', timeZone: 'America/Lima' },
          },
        },
      }),
      tx,
    );
    expect(repo.updateStatus).toHaveBeenCalledWith('tenant', 'SERVICES', tx);
  });
  it('blocks services until address is saved', async () => {
    const { service, tx } = setup('LOCATION');
    await expect(service.updateServices('owner', { services: [{ name: 'Cut', price: 0 as never, durationMinutes: 30 }] })).rejects.toThrow(
      'previous onboarding steps',
    );
    expect(tx.service.create).not.toHaveBeenCalled();
  });
  it('does not advance an invalid address selection', async () => {
    const { service, repo } = setup('LOCATION');
    await expect(
      service.updateLocation('owner', 'tenant', {
        country: 'US',
        province: 'California',
        city: 'San Francisco',
        addressLine1: 'Main 123',
      }),
    ).rejects.toThrow('país válido');
    expect(repo.update).not.toHaveBeenCalled();
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });
  it('requires a saved address before confirmation or activation', async () => {
    const { service, repo, tenant, subscriptions } = setup('CONFIRM');
    repo.lockTenant.mockResolvedValue({ ...tenant, addressLine1: '' });
    await expect(service.confirm('owner')).rejects.toThrow('dirección');
    expect(repo.claimConfirmation).not.toHaveBeenCalled();
    expect(subscriptions.createTrialSubscription).not.toHaveBeenCalled();
  });
});
