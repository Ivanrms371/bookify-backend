import { renderToStaticMarkup } from 'react-dom/server';
import {
  TrialEnds7dTemplate,
  TrialEnds3dTemplate,
  Renewal3dTemplate,
} from '../application/templates/billing-notice/billing-notice.template';
import { NotificationConfigService } from '../notification-config.service';
import { NotificationUsageService } from '../application/services/notification-usage.service';
import type { BuildEmailResponse } from '../domain/templates/build-email.interface';
const variables = {
  businessName: 'Salón <script>',
  eventAt: '2026-10-17T18:00:00Z',
  endDate: '17 de octubre de 2026',
  endTime: '15:00',
  timeZone: 'America/Montevideo',
  dueDate: '2026-10-10',
  actionPath: '/salon/billing/plans',
  actionUrl: 'https://app.example.com/salon/billing/plans',
};
it.each([new TrialEnds7dTemplate(), new TrialEnds3dTemplate(), new Renewal3dTemplate()])(
  'renders explicit dates and safe owner actions: %s',
  (template) => {
    const email = template.build('EMAIL', variables) as BuildEmailResponse;
    const html = renderToStaticMarkup(email.react);
    expect(html).toContain('17 de octubre de 2026');
    expect(html).toContain('Salón &lt;script&gt;');
    expect(html).not.toMatch(/Cancelar cita|Reprogramar cita|USD|UYU|cobro automático/);
    expect(template.build('IN_APP', variables)).toEqual(
      expect.objectContaining({
        action: { version: 1, kind: 'BILLING', destination: template.type === 'billing.renewal.3d' ? 'OVERVIEW' : 'PLANS' },
      }),
    );
    expect(() => template.build('WHATSAPP', variables)).toThrow();
  },
);
it('does not render unsafe links or promise a charge when a trial ends', () => {
  const template = new TrialEnds7dTemplate();
  const html = renderToStaticMarkup(
    (template.build('EMAIL', { ...variables, actionUrl: 'javascript:alert(1)' }) as BuildEmailResponse).react,
  );
  expect(html).not.toContain('href="javascript:');
  expect(html).not.toContain('Ver planes');
  expect(html).toContain('15:00');
});
it.each(['billing.trial.ends.7d', 'billing.trial.ends.3d', 'billing.renewal.3d'])(
  'does not read or reserve business quota for %s',
  async (type) => {
    const prisma = { $transaction: jest.fn() };
    const config = new NotificationConfigService();
    const service = new NotificationUsageService(prisma as never, config, {} as never);
    expect(config.getChannels(type, 'USER').map((c) => c.channel)).toEqual(['IN_APP', 'EMAIL']);
    expect(
      await service.reserve({
        id: 'delivery',
        channel: 'EMAIL',
        retryCount: 0,
        notification: { type, tenantId: 'tenant', recipientType: 'USER' },
      } as never),
    ).toBe(true);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  },
);
