import { renderToStaticMarkup } from 'react-dom/server';
import { ProfessionalDayStartTemplate } from '../application/templates/professional-day-start/professional-day-start.template';
import type { BuildEmailResponse } from '../domain/templates/build-email.interface';

const template = new ProfessionalDayStartTemplate();
const variables = {
  professionalName: 'Ana <script>',
  count: 1,
  date: 'viernes 9 de octubre',
  firstTime: '09:30',
  workingHours: '09:00–12:00, 14:00–18:00',
  agendaPath: '/salon/calendar',
  agendaUrl: 'https://app.example.com/salon/calendar',
};
it.each([1, 3])('renders the correct singular/plural for %s appointments with safe content', (count) => {
  const result = template.build('EMAIL', { ...variables, count }) as BuildEmailResponse;
  const html = renderToStaticMarkup(result.react);
  expect(result.subject).toBe(`Tu agenda de hoy: ${count} ${count === 1 ? 'cita' : 'citas'}`);
  expect(html).toContain(variables.workingHours);
  expect(html).toContain(variables.firstTime);
  expect(html).toContain('Ana &lt;script&gt;');
  expect(html).toContain('Ver mi agenda');
  expect(html).not.toContain('Cancelar cita');
});
it.each([undefined, 'javascript:alert(1)'])('omits unavailable or unsafe email action: %s', (agendaUrl) => {
  const result = template.build('EMAIL', { ...variables, agendaUrl }) as BuildEmailResponse;
  expect(renderToStaticMarkup(result.react)).not.toContain('Ver mi agenda');
});
it('provides a calendar action without inventing an appointment ID', () => {
  expect(template.build('IN_APP', variables)).toEqual(
    expect.objectContaining({
      title: 'Tu agenda de hoy: 1 cita',
      actionUrl: '/salon/calendar',
      actionLabel: 'Ver mi agenda',
      action: { version: 1, kind: 'CALENDAR' },
    }),
  );
  expect(template.build('IN_APP', { ...variables, agendaPath: undefined })).not.toHaveProperty('action');
});
it('does not enable WhatsApp', () => {
  expect(() => template.build('WHATSAPP', variables)).toThrow('Unsupported channel');
});
