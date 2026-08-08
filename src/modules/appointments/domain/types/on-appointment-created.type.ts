export interface OnAppointmentCreatedData {
  tenantId: string;
  professionalId: string;
  customerId: string;
  startsAt: Date;
  isNewCustomer: boolean;
}
