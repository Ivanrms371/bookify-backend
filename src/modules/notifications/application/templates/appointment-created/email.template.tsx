import type { AppointmentCreatedVariables } from './appointment-created.type';
import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';

export const AppointmentCreatedEmailTemplate = (v: AppointmentCreatedVariables) => {
  const customer = v.audience ? v.audience === 'CUSTOMER' : v.createdBy === 'STAFF';
  return (
    <AppointmentEmail
      label="CITA REGISTRADA"
      heading={customer ? 'Tu cita quedó registrada' : 'Tienes una nueva cita'}
      preview={`${v.serviceName} · ${v.date} a las ${v.time}`}
      detailsUrl={v.detailsUrl}
      primaryLabel={customer ? 'Ver mi cita' : 'Ver cita'}
      cancelUrl={customer ? v.cancelUrl : undefined}
      rescheduleUrl={customer ? v.rescheduleUrl : undefined}
    >
      <AppointmentDetail label="Hola">{customer ? v.customerName : v.professionalName}</AppointmentDetail>
      <AppointmentDetail label="Servicio">{v.serviceName}</AppointmentDetail>
      <AppointmentDetail label={customer ? 'Profesional' : 'Cliente'}>{customer ? v.professionalName : v.customerName}</AppointmentDetail>
      <AppointmentDetail label="Fecha">{v.date}</AppointmentDetail>
      <AppointmentDetail label="Hora">{v.time}</AppointmentDetail>
    </AppointmentEmail>
  );
};
export default AppointmentCreatedEmailTemplate;
