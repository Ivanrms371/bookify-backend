export interface OnAppointmentCreatedData {
  tenantId: string;
  employeeId: string;
  customerId: string;
  startTime: Date;
  isNewCustomer: boolean;
}
