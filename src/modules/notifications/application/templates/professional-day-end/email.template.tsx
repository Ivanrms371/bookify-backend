import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';
import type { ProfessionalEveningSummaryVariables } from '../../../../appointments/types/professional-summary.type';

export function ProfessionalDayEndEmail(v: ProfessionalEveningSummaryVariables) {
  const completed = `${v.completedCount} ${v.completedCount === 1 ? 'cita' : 'citas'}`;
  return (
    <AppointmentEmail
      label="RESUMEN DEL DÍA"
      heading={`Tu resumen del ${v.date}`}
      preview={`Completaste ${completed}`}
      detailsUrl={v.agendaUrl}
      primaryLabel="Ver resumen del día"
    >
      <AppointmentDetail label="Hola">{v.professionalName}</AppointmentDetail>
      <AppointmentDetail label="Completadas">{v.completedCount}</AppointmentDetail>
      <AppointmentDetail label="Valor de servicios completados">
        {v.completedValue} {v.currency}
      </AppointmentDetail>
      <AppointmentDetail label="Canceladas">{v.cancelledCount}</AppointmentDetail>
      <AppointmentDetail label="Ausencias">{v.noShowCount}</AppointmentDetail>
      {v.unresolvedCount > 0 && (
        <AppointmentDetail label="Pendientes de registrar">
          {v.unresolvedCount} {v.unresolvedCount === 1 ? 'cita' : 'citas'}
        </AppointmentDetail>
      )}
      <AppointmentDetail label="Datos al">{v.snapshotTime}</AppointmentDetail>
    </AppointmentEmail>
  );
}
