import { AppointmentEmail, AppointmentDetail } from '../_components/AppointmentEmail';
import type { BillingNoticeVariables } from '../../../../subscriptions/types/billing-notice.type';

export function BillingNoticeEmail(v: BillingNoticeVariables, title: string, message: string, label: string) {
  return (
    <AppointmentEmail label="FACTURACIÓN" heading={title} preview={message} detailsUrl={v.actionUrl} primaryLabel={label}>
      <AppointmentDetail label="Negocio">{v.businessName}</AppointmentDetail>
      <AppointmentDetail label="Aviso">{message}</AppointmentDetail>
    </AppointmentEmail>
  );
}
