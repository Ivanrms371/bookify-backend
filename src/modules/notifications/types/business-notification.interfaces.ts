interface AppointmentData {
  customerName: string;
  businessName: string;
  date: string;
  time: string;
}

export interface SendAppointmentConfirmationDto {
  userId: string;
  businessId: string;
  phone: string;
  appointmentData: AppointmentData;
}

export interface SendAppointmentCancelledDto {
  userId: string;
  businessId: string;
  phone: string;
  appointmentData: AppointmentData;
}

export interface SendAuthOtpDto {
  userId: string;
  businessId: string;
  phone: string;
  code: string;
}

export interface ScheduleAppointmentReminderDto {
  userId: string;
  appointmentId: string;
  businessId: string;
  customerPhone: string;
  customerEmail: string;
  appointmentData: AppointmentData;
}

export interface ScheduleAppointmentReminder24hDto extends ScheduleAppointmentReminderDto {}

export interface ScheduleAppointmentReminder2hDto extends ScheduleAppointmentReminderDto {}

export interface SchedulePostAppointmentThankYouDto extends ScheduleAppointmentReminderDto {}
