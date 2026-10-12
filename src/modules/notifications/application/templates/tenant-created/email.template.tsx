import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';
import type { TenantCreatedVariables } from './tenant-created.type';

export function TenantCreatedEmail(v: TenantCreatedVariables, message: string) {
  return (
    <AppointmentEmail
      label="BIENVENIDA"
      heading="¡Bienvenido a Bookify!"
      preview={message}
      detailsUrl={v.businessUrl}
      primaryLabel="Ir a mi negocio"
    >
      <AppointmentDetail label="Negocio">{v.tenantName || 'Tu negocio'}</AppointmentDetail>
      <AppointmentDetail label="Todo listo">{message}</AppointmentDetail>
    </AppointmentEmail>
  );
}
