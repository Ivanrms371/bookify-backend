import { AppointmentStatus } from 'src/generated/prisma/enums';

export type FindBusinessAppointmentsFilters = {
  startDate?: Date;
  endDate?: Date;
  status?: AppointmentStatus;
  staffId?: string;
  customerId?: string;
  upcoming?: boolean;
  limit?: number;
  offset?: number;
};
