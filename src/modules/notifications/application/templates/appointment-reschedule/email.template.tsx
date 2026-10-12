import { RecipientType } from 'src/generated/prisma/enums';
import type { AppointmentRescheduledVariables } from './appointment-reschedule.type';
import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';

export const AppointmentRescheduleEmailTemplate = (v: AppointmentRescheduledVariables) => {
  const professional = v.audience ? v.audience === 'PROFESSIONAL' : v.rescheduledBy === RecipientType.CUSTOMER;
  return (
    <AppointmentEmail
      label="CITA REPROGRAMADA"
      heading={professional ? 'El cliente reprogramó su cita' : 'Tu cita fue reprogramada'}
      preview={`Nuevo horario: ${v.date} a las ${v.time}`}
      detailsUrl={v.detailsUrl}
      primaryLabel={professional ? 'Ver cita' : 'Ver mi cita'}
      cancelUrl={professional ? undefined : v.cancelUrl}
      rescheduleUrl={professional ? undefined : v.rescheduleUrl}
    >
      <AppointmentDetail label="Hola">{professional ? v.professionalName : v.customerName}</AppointmentDetail>
      <AppointmentDetail label="Servicio">{v.serviceName}</AppointmentDetail>
      <AppointmentDetail label={professional ? 'Cliente' : 'Profesional'}>
        {professional ? v.customerName : v.professionalName}
      </AppointmentDetail>
      {v.previousDate && v.previousTime && (
        <AppointmentDetail label="Antes">
          {v.previousDate} a las {v.previousTime}
        </AppointmentDetail>
      )}
      <AppointmentDetail label="Ahora">
        {v.date} a las {v.time}
      </AppointmentDetail>
      {v.rescheduledByName && <AppointmentDetail label="Reprogramada por">{v.rescheduledByName}</AppointmentDetail>}
      {v.rescheduleReason && <AppointmentDetail label="Motivo">{v.rescheduleReason}</AppointmentDetail>}
    </AppointmentEmail>
  );
};
export default AppointmentRescheduleEmailTemplate;
