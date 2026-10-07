import { ScheduleExceptionService } from './schedule-exception.service';
import type { ScheduleExceptionRepository } from './schedule-exception.repository';
import type { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';

describe('Settings schedule exceptions', () => {
  const dto: CreateScheduleExceptionDto = {
    startDate: '2026-10-12',
    endDate: '2026-10-12',
    isClosed: false,
    professionalIds: ['professional-a'],
    intervals: [{ opensAt: '09:00', closesAt: '18:00' }],
    reason: 'Horario especial',
  };
  const row = {
    id: 'exception-a',
    startDate: new Date(dto.startDate),
    endDate: new Date(dto.endDate),
    isClosed: false,
    reason: dto.reason,
    blocks: [{ opensAt: 540, closesAt: 1080 }],
    professionals: [{ professionalId: 'professional-a', professional: { name: 'Ana' } }],
  };
  function fixture() {
    const repository = {
      countTenantProfessionals: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(row),
      findById: jest.fn().mockResolvedValue(row),
      update: jest.fn().mockResolvedValue(row),
    };
    return { repository, service: new ScheduleExceptionService(repository as unknown as ScheduleExceptionRepository) };
  }
  it('creates a tenant-scoped exception and returns editable times', async () => {
    const { repository, service } = fixture();
    const result = await service.create('tenant-a', dto);
    expect(repository.countTenantProfessionals).toHaveBeenCalledWith('tenant-a', ['professional-a']);
    expect(repository.create.mock.calls[0][0].tenant).toEqual({ connect: { id: 'tenant-a' } });
    expect(result.blocks).toEqual(dto.intervals);
  });
  it.each(['create', 'update'] as const)('rejects foreign/deleted professionals before %s persistence', async (action) => {
    const { repository, service } = fixture();
    repository.countTenantProfessionals.mockResolvedValue(0);
    await expect(action === 'create' ? service.create('tenant-a', dto) : service.update('tenant-a', 'exception-a', dto)).rejects.toThrow(
      'pertenecer',
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });
  it.each([
    { ...dto, endDate: '2026-10-11' },
    { ...dto, professionalIds: ['professional-a', 'professional-a'] },
    { ...dto, intervals: [] },
    { ...dto, intervals: [{ opensAt: '25:00', closesAt: '26:00' }] },
    { ...dto, intervals: [{ opensAt: '18:00', closesAt: '09:00' }] },
    {
      ...dto,
      intervals: [
        { opensAt: '09:00', closesAt: '12:00' },
        { opensAt: '11:00', closesAt: '13:00' },
      ],
    },
  ])('rejects invalid dates/intervals/selection', async (invalid) => {
    const { repository, service } = fixture();
    await expect(service.create('tenant-a', invalid)).rejects.toThrow();
    expect(repository.create).not.toHaveBeenCalled();
  });
  it('full-day closure creates no time blocks', async () => {
    const { repository, service } = fixture();
    await service.create('tenant-a', { ...dto, isClosed: true, intervals: undefined });
    expect(repository.create.mock.calls[0][0].blocks).toEqual({ createMany: { data: [] } });
  });
});
