import { TenantUsageService } from './tenant-usage.service';
import { TenantUsageRepository } from './tenant-usage.repository';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';

describe('TenantUsageService period numbering', () => {
  afterEach(() => jest.useRealTimers());
  it.each([0, 9, 11])('uses the same 1-based month for every operation in month index %i', async (month) => {
    jest.useFakeTimers().setSystemTime(new Date(2026, month, 15, 12));
    const repository = {
      upsert: jest.fn(),
      incrementAppointmentsCount: jest.fn(),
      findByTenantId: jest.fn().mockResolvedValue(null),
      incrementEmailCount: jest.fn(),
      incrementWhatsappCount: jest.fn(),
    };
    const service = new TenantUsageService(repository as unknown as TenantUsageRepository);
    const expected = { tenantId: 'tenant', periodMonth: month + 1, periodYear: 2026 };
    const limits = { appointmentLimit: -1, emailLimit: 1200, whatsappLimit: 500 };
    const tx = {} as TransactionClient;
    await service.upsert('tenant', limits, tx);
    await service.incrementAppointmentsCount('tenant');
    await service.findByTenantId('tenant');
    await service.incrementEmailCount('tenant');
    await service.incrementWhatsappCount('tenant');
    await service.getUsageStatus('tenant');
    expect(repository.upsert).toHaveBeenCalledWith(expected, limits, tx);
    for (const operation of [
      repository.incrementAppointmentsCount,
      repository.findByTenantId,
      repository.incrementEmailCount,
      repository.incrementWhatsappCount,
    ]) {
      expect(operation).toHaveBeenCalledWith(expected);
    }
  });
});
