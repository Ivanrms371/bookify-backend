import type { AppointmentCancelledVariables } from './appointment-cancelled.type';
import { RecipientType } from 'src/generated/prisma/enums';
import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';

export const AppointmentCancelledEmailTemplate = (v: AppointmentCancelledVariables) => {
  const professional = v.audience ? v.audience === 'PROFESSIONAL' : v.cancelledBy === RecipientType.CUSTOMER;
  return (
    <AppointmentEmail
      label="CITA CANCELADA"
      heading={professional ? 'El cliente canceló su cita' : 'Tu cita fue cancelada'}
      preview={`${v.date} a las ${v.time} · ${professional ? v.customerName : v.professionalName}`}
      detailsUrl={v.detailsUrl}
      primaryLabel={professional ? 'Ver cita cancelada' : 'Ver mi cita'}
    >
      <AppointmentDetail label="Hola">{professional ? v.professionalName : v.customerName}</AppointmentDetail>
      <AppointmentDetail label={professional ? 'Cliente' : 'Profesional'}>
        {professional ? v.customerName : v.professionalName}
      </AppointmentDetail>
      <AppointmentDetail label="Fecha cancelada">{v.date}</AppointmentDetail>
      <AppointmentDetail label="Hora">{v.time}</AppointmentDetail>
      {v.cancelledByName && <AppointmentDetail label="Cancelada por">{v.cancelledByName}</AppointmentDetail>}
      {v.cancellationReason && <AppointmentDetail label="Motivo">{v.cancellationReason}</AppointmentDetail>}
    </AppointmentEmail>
  );
};
export default AppointmentCancelledEmailTemplate;
