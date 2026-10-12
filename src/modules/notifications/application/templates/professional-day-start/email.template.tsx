import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';
import type { ProfessionalSummaryVariables } from '../../../../appointments/types/professional-summary.type';

export function ProfessionalDayStartEmail(v: ProfessionalSummaryVariables) {
  const count = `${v.count} ${v.count === 1 ? 'cita' : 'citas'}`;
  return (
    <AppointmentEmail
      label="TU AGENDA"
      heading={`Tu agenda de hoy: ${count}`}
      preview={`La primera es a las ${v.firstTime}`}
      detailsUrl={v.agendaUrl}
      primaryLabel="Ver mi agenda"
    >
      <AppointmentDetail label="Hola">{v.professionalName}</AppointmentDetail>
      <AppointmentDetail label="Agenda">
        Hoy tenés {count} {v.count === 1 ? 'programada' : 'programadas'}. La primera es a las {v.firstTime}.
      </AppointmentDetail>
      <AppointmentDetail label="Fecha">{v.date}</AppointmentDetail>
      <AppointmentDetail label="Jornada">{v.workingHours}</AppointmentDetail>
    </AppointmentEmail>
  );
}
