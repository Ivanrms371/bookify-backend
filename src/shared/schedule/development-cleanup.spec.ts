import { v5 as uuidv5 } from 'uuid';
import type { TransactionClient } from '../../generated/prisma/internal/prismaNamespace';
import { removeDevelopmentDemo } from '../../../prisma/development/cleanup';
import { PROFESSIONALS, SLUG, TENANT_ID } from '../../../prisma/development/fixtures';

const legacyId = (key: string) => uuidv5(`bookify:development:v1:${key}`, uuidv5.URL);
function setup(tenantId = legacyId('tenant')) {
  const tx = {
    tenant: { findMany: jest.fn().mockResolvedValue([{ id: tenantId, slug: SLUG }]), deleteMany: jest.fn() },
    user: { findMany: jest.fn().mockResolvedValue(PROFESSIONALS.map((p) => ({
      id: legacyId(`user:${p.key}`), email: p.email, memberships: [{ tenantId }], professional: { tenantId },
    }))), deleteMany: jest.fn() },
    appointmentBlock: { deleteMany: jest.fn() },
    appointment: { deleteMany: jest.fn() },
    notificationLog: { deleteMany: jest.fn() },
    notificationDelivery: { deleteMany: jest.fn() },
    inAppNotification: { deleteMany: jest.fn() },
    notification: { deleteMany: jest.fn() },
  };
  return { tx, run: () => removeDevelopmentDemo(tx as unknown as TransactionClient) };
}
describe('development demo cleanup', () => {
  it.each([legacyId('tenant'), TENANT_ID])('removes only the recognized demo tenant %s', async (id) => {
    const { tx, run } = setup(id);
    await run();
    expect(tx.tenant.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [id] } } });
    expect(tx.appointmentBlock.deleteMany).toHaveBeenCalledWith({ where: { appointment: { tenantId: { in: [id] } } } });
    expect(tx.appointmentBlock.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.appointment.deleteMany.mock.invocationCallOrder[0]);
    expect(tx.appointment.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.tenant.deleteMany.mock.invocationCallOrder[0]);
    expect(tx.user.deleteMany).toHaveBeenCalledWith({ where: { id: { in: PROFESSIONALS.map((p) => legacyId(`user:${p.key}`)) } } });
  });
  it('refuses a slug belonging to an unrelated tenant before deleting anything', async () => {
    const { tx, run } = setup('unrelated');
    await expect(run()).rejects.toThrow('unrelated tenant');
    expect(tx.appointmentBlock.deleteMany).not.toHaveBeenCalled();
  });
  it('preserves demo accounts shared with other tenants', async () => {
    const { tx, run } = setup();
    tx.user.findMany.mockResolvedValue([{ id: legacyId(`user:${PROFESSIONALS[0].key}`), email: PROFESSIONALS[0].email, memberships: [{ tenantId: 'other' }], professional: null }] as any);
    await expect(run()).rejects.toThrow('shared');
    expect(tx.tenant.deleteMany).not.toHaveBeenCalled();
    expect(tx.user.deleteMany).not.toHaveBeenCalled();
  });
});
