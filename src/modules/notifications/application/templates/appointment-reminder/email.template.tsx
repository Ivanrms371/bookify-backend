import type { AppointmentReminderVariables } from './appointment-reminder.type';
import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';

export const AppointmentReminderEmailTemplate = (v: AppointmentReminderVariables) => (
  <AppointmentEmail
    label="RECORDATORIO DE CITA"
    heading="Te esperamos en tu próxima cita"
    preview={`${v.serviceName} con ${v.professionalName} · ${v.date} a las ${v.time}`}
    detailsUrl={v.detailsUrl}
    cancelUrl={v.cancelUrl}
    rescheduleUrl={v.rescheduleUrl}
  >
    <AppointmentDetail label="Hola">{v.customerName}</AppointmentDetail>
    <AppointmentDetail label="Servicio">{v.serviceName}</AppointmentDetail>
    <AppointmentDetail label="Profesional">{v.professionalName}</AppointmentDetail>
    <AppointmentDetail label="Fecha">{v.date}</AppointmentDetail>
    <AppointmentDetail label="Hora">{v.time}</AppointmentDetail>
  </AppointmentEmail>
);
export default AppointmentReminderEmailTemplate;
