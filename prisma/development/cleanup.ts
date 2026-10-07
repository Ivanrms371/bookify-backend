import { v5 as uuidv5 } from 'uuid';
import type { TransactionClient } from '../../src/generated/prisma/internal/prismaNamespace';
import { PROFESSIONALS, SLUG, TENANT_ID } from './fixtures';

// v5 is used only to recognize records created by the previous seed.
const legacyId = (key: string) => uuidv5(`bookify:development:v1:${key}`, uuidv5.URL);

export async function removeDevelopmentDemo(tx: TransactionClient) {
  const ids = [TENANT_ID, legacyId('tenant')];
  const tenants = await tx.tenant.findMany({ where: { OR: [{ id: { in: ids } }, { slug: SLUG }] } });
  if (tenants.some((tenant) => !ids.includes(tenant.id) || tenant.slug !== SLUG)) {
    throw new Error('Demo tenant identity collides with an unrelated tenant; refusing cleanup.');
  }
  const users = await tx.user.findMany({
    where: { email: { in: PROFESSIONALS.map((professional) => professional.email) } },
    include: { memberships: true, professional: true },
  });
  for (const user of users) {
    const fixture = PROFESSIONALS.find((professional) => professional.email === user.email)!;
    if (
      ![fixture.userId, legacyId(`user:${fixture.key}`)].includes(user.id) ||
      user.memberships.some((membership) => !ids.includes(membership.tenantId)) ||
      (user.professional && !ids.includes(user.professional.tenantId))
    ) {
      throw new Error('Demo account is unrelated or shared with another tenant; refusing cleanup.');
    }
  }
  const tenantIds = tenants.map((tenant) => tenant.id);
  const userIds = users.map((user) => user.id);
  const notificationScope = { tenantId: { in: tenantIds } };
  await tx.notificationLog.deleteMany({ where: { delivery: { notification: notificationScope } } });
  await tx.notificationDelivery.deleteMany({ where: { notification: notificationScope } });
  await tx.inAppNotification.deleteMany({ where: { OR: [notificationScope, { userId: { in: userIds } }] } });
  await tx.notification.deleteMany({ where: notificationScope });
  // Blocks do not cascade; appointments must go before their referenced resources.
  await tx.appointmentBlock.deleteMany({ where: { appointment: { tenantId: { in: tenantIds } } } });
  await tx.appointment.deleteMany({ where: { tenantId: { in: tenantIds } } });
  await tx.tenant.deleteMany({ where: { id: { in: tenantIds } } });
  await tx.user.deleteMany({ where: { id: { in: userIds } } });
}
