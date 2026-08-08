export type AppointmentReminderVariables = {
  customerName: string;
  appointmentId: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
  reminderType: '24h' | '2h';
  cancelUrl: string;
  rescheduleUrl: string;
};
