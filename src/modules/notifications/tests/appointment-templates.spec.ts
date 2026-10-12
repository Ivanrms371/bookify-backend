import { toPlainText } from '@react-email/render';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';

async function render(content: ReactNode, options?: { plainText: boolean }) {
  const html = renderToStaticMarkup(content);
  return options?.plainText ? toPlainText(html) : html;
}
import { AppointmentCreatedTemplate } from '../application/templates/appointment-created/appointment-created.template';
import { AppointmentCancelledTemplate } from '../application/templates/appointment-cancelled/appointment-cancelled.template';
import { AppointmentRescheduledTemplate } from '../application/templates/appointment-reschedule/appointment-reschedule.template';
import { AppointmentReminderTemplate } from '../application/templates/appointment-reminder/appointment-reminder.template';
import { appointmentFixture as fixture, appointmentPreviews } from '../application/templates/previews/appointment.fixtures';
import { appointmentUrl } from '../application/templates/_components/appointment-links';

const created = new AppointmentCreatedTemplate();
const cancelled = new AppointmentCancelledTemplate();
const rescheduled = new AppointmentRescheduledTemplate();
const reminder = new AppointmentReminderTemplate();

it.each(appointmentPreviews)('renders $name with explicit facts and no runtime preview defaults', async ({ content }) => {
  const html = await render(content);
  const text = await render(content, { plainText: true });
  expect(text).toContain(fixture.date);
  expect(text).toContain(fixture.time);
  expect(html).not.toMatch(/localhost|Iván Rodríguez|2024/);
  expect(html).toContain('lang="es"');
});
it('uses registered wording for the customer and keeps the professional audience separate', async () => {
  const customer = { ...fixture, createdBy: 'STAFF' as const };
  const email = created.build('EMAIL', customer) as any;
  expect(email.subject).toContain('Cita registrada');
  expect(await render(email.react, { plainText: true })).toContain('Tu cita quedó registrada');
  expect(created.build('WHATSAPP', customer)).toMatchObject({ body: expect.stringContaining('quedó registrada') });
  expect(created.build('IN_APP', customer)).toMatchObject({
    title: 'Cita registrada',
    action: { version: 1, kind: 'APPOINTMENT', appointmentId: fixture.appointmentId },
  });
  const professional = created.build('EMAIL', { ...fixture, createdBy: 'CUSTOMER' }) as any;
  expect(await render(professional.react, { plainText: true })).toContain('Tienes una nueva cita');
});
it('renders before and after schedules, optional reasons and the cancelled date', async () => {
  const email = rescheduled.build('EMAIL', {
    ...fixture,
    previousDate: '15 de octubre',
    previousTime: '11:00',
    rescheduleReason: 'Cambio solicitado',
  }) as any;
  const text = await render(email.react, { plainText: true });
  expect(text).toContain('Antes:');
  expect(text).toContain('Ahora:');
  expect(text).toContain('Cambio solicitado');
  const cancellation = cancelled.build('EMAIL', { ...fixture, cancelledBy: 'CUSTOMER' }) as any;
  const cancellationText = await render(cancellation.react, { plainText: true });
  expect(cancellationText).toContain('El cliente canceló su cita');
  expect(cancellationText).toContain('Fecha cancelada:');
  expect(cancellationText).not.toContain('Motivo:');
});
it.each(['javascript:alert(1)', '/appointments', 'https://', 'https://user:secret@example.com', 'not a URL', undefined])(
  'omits unsafe or absent links: %s',
  async (url) => {
    expect(appointmentUrl(url)).toBeUndefined();
    const vars = { ...fixture, detailsUrl: url, cancelUrl: url, rescheduleUrl: url, reminderType: '24h' as const };
    for (const template of [created, reminder, rescheduled, cancelled]) {
      const email = template.build('EMAIL', vars as any) as any;
      const html = await render(email.react);
      expect(html).not.toMatch(/>Ver mi cita<|>Ver cita<|>Cancelar cita<|>Reprogramar cita</);
      const whatsapp = template.build('WHATSAPP', vars as any) as any;
      expect(whatsapp.body).not.toMatch(/undefined|javascript:|https:\/\//);
    }
  },
);
it.each(['24h', '2h'] as const)('uses the explicit date for the %s reminder without relative-time promises', async (reminderType) => {
  const vars = { ...fixture, reminderType };
  const message = reminder.build('WHATSAPP', vars) as any;
  expect(message.body).toContain(fixture.date);
  expect(message.body).not.toMatch(/mañana|manana|en 2 horas/);
  const email = reminder.build('EMAIL', vars) as any;
  expect(await render(email.react)).not.toMatch(/mañana|en 2 horas/);
});
it('escapes user content in HTML and preserves valid links in HTML and text', async () => {
  const email = rescheduled.build('EMAIL', {
    ...fixture,
    customerName: '<script>alert(1)</script>',
    rescheduleReason: '<img src=x onerror=alert(1)>',
  }) as any;
  const html = await render(email.react);
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&lt;img');
  expect(html).not.toContain('<script>');
  expect(html).toContain(fixture.detailsUrl);
  expect(await render(email.react, { plainText: true })).toContain(fixture.detailsUrl);
});

it('acknowledges customer self-booking using the explicit audience independently of the actor', async () => {
  const variables = { ...fixture, audience: 'CUSTOMER' as const, createdBy: 'CUSTOMER' as const };
  const email = created.build('EMAIL', variables) as any;
  expect(email.subject).toContain('Cita registrada');
  expect(await render(email.react, { plainText: true })).toContain('Tu cita quedó registrada');
  expect(created.build('WHATSAPP', variables)).toMatchObject({ body: expect.stringContaining('Hola ' + fixture.customerName) });
});
it('addresses a professional reschedule notice to the professional and omits customer management actions', async () => {
  const variables = { ...fixture, audience: 'PROFESSIONAL' as const };
  const email = rescheduled.build('EMAIL', variables) as any;
  const html = await render(email.react);
  const text = await render(email.react, { plainText: true });
  expect(text).toContain('El cliente reprogramó su cita');
  expect(text).toContain('Hola: ' + fixture.professionalName);
  expect(text).toContain('Cliente: ' + fixture.customerName);
  expect(html).not.toMatch(/>Cancelar cita<|>Reprogramar cita</);
  expect(rescheduled.build('IN_APP', variables)).toMatchObject({ message: expect.stringContaining(fixture.customerName) });
});

it('renders legacy professional reschedules using rescheduledBy when no explicit audience was stored', async () => {
  const variables = { ...fixture, rescheduledBy: 'CUSTOMER' as const };
  const email = rescheduled.build('EMAIL', variables) as any;
  const text = await render(email.react, { plainText: true });
  expect(text).toContain('El cliente reprogramó su cita');
  expect(text).toContain('Hola: ' + fixture.professionalName);
  expect(text).not.toContain('Cancelar cita');
  expect(text).not.toContain('Reprogramar cita');
  expect(rescheduled.build('WHATSAPP', variables)).toMatchObject({ body: expect.stringContaining('Hola ' + fixture.professionalName) });
});
