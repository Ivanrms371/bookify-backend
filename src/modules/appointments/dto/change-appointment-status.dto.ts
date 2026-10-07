import { IsIn } from 'class-validator';
import { AppointmentStatus } from 'src/generated/prisma/enums';

export class ChangeAppointmentStatusDto {
  @IsIn([AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW])
  status: AppointmentStatus;
}
