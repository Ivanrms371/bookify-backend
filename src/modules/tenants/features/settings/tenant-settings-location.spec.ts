import { TenantSettingsService } from './tenant-settings.service';
import { TenantSettingsRepository } from './tenant-settings.repository';
import type { PrismaService } from 'src/shared/prisma/prisma.service';

const fixture = () => {
  const repository = {
    getSettings: jest.fn().mockResolvedValue({
      country: 'UY',
      province: 'Montevideo',
      city: 'Montevideo',
      settings: { currency: 'UYU', timeZone: 'America/Montevideo' },
    }),
    updateGeneralSettings: jest.fn(),
  };
  return { repository, service: new TenantSettingsService(repository as unknown as TenantSettingsRepository, {} as PrismaService) };
};
describe('shared location settings', () => {
  it('supports the same five-country catalog and derives preferences', async () => {
    const { repository, service } = fixture();
    await service.updateGeneralSettings('tenant', {
      country: 'PE',
      province: 'Lima',
      city: 'Lima',
      timeZone: 'Asia/Tokyo',
      currency: 'USD',
    });
    expect(repository.updateGeneralSettings).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({ country: 'PE', province: 'Lima', currency: 'PEN', timeZone: 'America/Lima' }),
    );
  });
  it('derives preferences from the saved country on partial updates', async () => {
    const { repository, service } = fixture();
    repository.getSettings.mockResolvedValue({
      country: 'AR',
      province: 'Buenos Aires',
      city: 'La Plata',
      settings: { currency: 'USD', timeZone: 'America/Argentina/Buenos_Aires' },
    });
    await service.updateGeneralSettings('tenant', { name: 'New name' });
    expect(repository.updateGeneralSettings).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({ currency: 'ARS', timeZone: 'America/Argentina/Buenos_Aires', province: 'Buenos Aires' }),
    );
  });
  it('derives country defaults and clears foreign region/city on a country-only change', async () => {
    const { repository, service } = fixture();
    await service.updateGeneralSettings('tenant', { country: 'AR' });
    expect(repository.updateGeneralSettings).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({
        country: 'AR',
        province: '',
        city: '',
        currency: 'ARS',
        timeZone: 'America/Argentina/Buenos_Aires',
      }),
    );
  });
  it('ignores client overrides and derives from the existing location', async () => {
    const { repository, service } = fixture();
    await service.updateGeneralSettings('tenant', { timeZone: 'not/a-zone', currency: 'FAKE' });
    expect(repository.updateGeneralSettings).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({ currency: 'UYU', timeZone: 'America/Montevideo' }),
    );
  });
  it('recalculates timezone when only the province changes', async () => {
    const { repository, service } = fixture();
    repository.getSettings.mockResolvedValue({
      country: 'CL',
      province: 'Metropolitana de Santiago',
      city: 'Santiago',
      settings: { currency: 'CLP', timeZone: 'America/Santiago' },
    });
    await service.updateGeneralSettings('tenant', { province: 'Magallanes y de la Antártica Chilena' });
    expect(repository.updateGeneralSettings).toHaveBeenCalledWith(
      'tenant',
      expect.objectContaining({ timeZone: 'America/Punta_Arenas', currency: 'CLP' }),
    );
  });
  it('writes currency and timezone to TenantSettings while address stays on Tenant', async () => {
    const prisma = { tenant: { update: jest.fn() } };
    const repository = new TenantSettingsRepository(prisma as unknown as PrismaService);
    await repository.updateGeneralSettings('tenant', { city: 'Lima', currency: 'PEN', timeZone: 'America/Lima' });
    expect(prisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant' },
      include: { settings: true },
      data: {
        city: 'Lima',
        settings: {
          upsert: { create: { currency: 'PEN', timeZone: 'America/Lima' }, update: { currency: 'PEN', timeZone: 'America/Lima' } },
        },
      },
    });
  });
});
