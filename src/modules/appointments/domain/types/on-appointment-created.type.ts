export interface OnAppointmentCreatedData {
  tenantId: string;
  staffId: string;
  customerId: string;
  startTime: Date;
  isNewCustomer: boolean;
}
