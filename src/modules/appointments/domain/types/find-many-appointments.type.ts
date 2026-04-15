import { AppointmentStatus } from 'src/generated/prisma/enums';

export type FindManyAppointmentsParams = {
  tenantId: string;
  staffId?: string;
  customerId?: string;
  query?: string;
  status?: AppointmentStatus;
  startDate: Date;
  endDate: Date;
  skip?: number;
  take?: number;
  orderBy?: 'name' | 'startTime' | 'createdAt';
  order?: 'asc' | 'desc';
};
