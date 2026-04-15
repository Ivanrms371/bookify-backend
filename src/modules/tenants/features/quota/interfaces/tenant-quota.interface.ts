export type TenantQuotaCreateInput = {
  appointmentLimit: number;
  emailLimit: number;
  professionalLimit: number;
  whatsappLimit: number;
  professionalCount?: number;
};
