import { renderToStaticMarkup } from 'react-dom/server';
import { ProfessionalDayEndTemplate } from '../application/templates/professional-day-end/professional-day-end.template';
import type { BuildEmailResponse } from '../domain/templates/build-email.interface';

const template = new ProfessionalDayEndTemplate();
const variables = {
  professionalName: 'Ana <script>',
  professionalId: 'professional',
  businessDate: '2026-10-09',
  date: '09 de octubre de 2026',
  completedCount: 2,
  cancelledCount: 1,
  noShowCount: 1,
  unresolvedCount: 2,
  completedValue: '90.05',
  currency: 'UYU',
  snapshotTime: '09 de octubre de 2026 a las 19:00',
  agendaPath: '/salon/calendar?notificationDate=2026-10-09',
  agendaUrl: 'https://app.example.com/salon/calendar?notificationDate=2026-10-09',
};
it('renders dated totals, discounted service value and snapshot time without implying cash collection', () => {
  const result = template.build('EMAIL', variables) as BuildEmailResponse;
  const html = renderToStaticMarkup(result.react);
  expect(result.subject).toBe('Tu resumen del 09 de octubre de 2026');
  for (const text of ['90.05', 'UYU', 'Canceladas', 'Ausencias', 'Pendientes de registrar', variables.snapshotTime, 'Ver resumen del día'])
    expect(html).toContain(text);
  expect(html).toContain('Ana &lt;script&gt;');
  expect(html).not.toMatch(/recaud|ganancia|comisi[oó]n|Cancelar cita|Reprogramar cita/);
});
it.each([0, 1, 3])('handles %s completions and hides zero unresolved counts in both channels', (completedCount) => {
  const v = { ...variables, completedCount, unresolvedCount: 0, completedValue: completedCount ? '90.05' : '0.00' };
  const inApp = template.build('IN_APP', v);
  expect(inApp).toEqual(
    expect.objectContaining({
      message: expect.stringContaining(`Completaste ${completedCount} ${completedCount === 1 ? 'cita.' : 'citas.'}`),
    }),
  );
  expect((inApp as { message: string }).message).not.toContain('pendiente');
  const html = renderToStaticMarkup((template.build('EMAIL', v) as BuildEmailResponse).react);
  expect(html).not.toContain('Pendientes de registrar');
});
it('includes the original date and professional in a typed calendar action', () => {
  expect(template.build('IN_APP', variables)).toEqual(
    expect.objectContaining({ action: { version: 1, kind: 'CALENDAR', date: '2026-10-09', professionalId: 'professional' } }),
  );
});
it.each([undefined, 'javascript:alert(1)'])('omits unavailable or unsafe email actions: %s', (agendaUrl) => {
  const html = renderToStaticMarkup((template.build('EMAIL', { ...variables, agendaUrl }) as BuildEmailResponse).react);
  expect(html).not.toContain('Ver resumen del día');
});
it('omits missing in-app actions and does not enable WhatsApp', () => {
  expect(template.build('IN_APP', { ...variables, agendaPath: undefined })).not.toHaveProperty('action');
  expect(() => template.build('WHATSAPP', variables)).toThrow('Unsupported channel');
});
