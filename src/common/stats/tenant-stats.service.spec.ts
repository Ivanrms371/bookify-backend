import { TenantStatsService } from './tenant-stats.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TransactionClient } from 'src/generated/prisma/internal/prismaNamespace';
import { OnAppointmentCreatedData } from 'src/modules/appointments/domain/types/on-appointment-created.type';

describe('TenantStatsService usage period', () => {
  it.each([0, 9, 11])('updates the 1-based usage period for appointment month index %i', async (month) => {
    const tx = { tenantLifetimeStats: { upsert: jest.fn() }, tenantDailyStats: { upsert: jest.fn() }, tenantUsage: { update: jest.fn() } };
    const service = new TenantStatsService({} as PrismaService);
    const data = { tenantId: 'tenant', startsAt: new Date(2026, month, 15, 12) } as OnAppointmentCreatedData;
    await service.onAppointmentCreated(data, tx as unknown as TransactionClient);
    expect(tx.tenantUsage.update).toHaveBeenCalledWith({
      where: { tenantId_periodMonth_periodYear: { tenantId: 'tenant', periodMonth: month + 1, periodYear: 2026 } },
      data: { appointmentCount: { increment: 1 } },
    });
  });
});
