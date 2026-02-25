export type AppointmentReminder = {
  customerName: string;
  appointmentId: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  reminderType: '24h' | '2h';
  cancelUrl: string;
  rescheduleUrl: string;
};
