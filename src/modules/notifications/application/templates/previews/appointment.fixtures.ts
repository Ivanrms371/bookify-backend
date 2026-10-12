import { AppointmentCreatedEmailTemplate } from '../appointment-created/email.template';
import { AppointmentCancelledEmailTemplate } from '../appointment-cancelled/email.template';
import { AppointmentRescheduleEmailTemplate } from '../appointment-reschedule/email.template';
import { AppointmentReminderEmailTemplate } from '../appointment-reminder/email.template';

export const appointmentFixture = {
  appointmentId: 'preview-appointment',
  customerName: 'Ana Ejemplo',
  professionalName: 'Lucía Ejemplo',
  serviceName: 'Corte y peinado',
  date: 'viernes, 16 de octubre de 2026',
  time: '14:30',
  detailsUrl: 'https://example.com/cita',
  cancelUrl: 'https://example.com/cita?action=cancel',
  rescheduleUrl: 'https://example.com/cita?action=reschedule',
};

export const appointmentPreviews = [
  { name: 'created-customer', content: AppointmentCreatedEmailTemplate({ ...appointmentFixture, createdBy: 'STAFF' }) },
  { name: 'created-professional', content: AppointmentCreatedEmailTemplate({ ...appointmentFixture, createdBy: 'CUSTOMER' }) },
  {
    name: 'cancelled-customer',
    content: AppointmentCancelledEmailTemplate({
      ...appointmentFixture,
      cancelledBy: 'USER',
      cancellationReason: 'Cambio de horario del negocio',
    }),
  },
  { name: 'cancelled-professional', content: AppointmentCancelledEmailTemplate({ ...appointmentFixture, cancelledBy: 'CUSTOMER' }) },
  {
    name: 'rescheduled',
    content: AppointmentRescheduleEmailTemplate({
      ...appointmentFixture,
      previousDate: 'jueves, 15 de octubre de 2026',
      previousTime: '11:00',
      rescheduleReason: 'Cambio solicitado',
    }),
  },
  ...(['24h', '2h'] as const).map((reminderType) => ({
    name: `reminder-${reminderType}`,
    content: AppointmentReminderEmailTemplate({ ...appointmentFixture, reminderType }),
  })),
  {
    name: 'long-no-links',
    content: AppointmentCreatedEmailTemplate({
      ...appointmentFixture,
      createdBy: 'STAFF',
      customerName: 'Ana María de los Santos Ejemplo',
      serviceName: 'Tratamiento completo de cuidado capilar y peinado para una ocasión especial con asesoramiento personalizado',
      professionalName: 'Lucía María Rodríguez del Campo Ejemplo',
      detailsUrl: undefined,
      cancelUrl: undefined,
      rescheduleUrl: undefined,
    }),
  },
];
