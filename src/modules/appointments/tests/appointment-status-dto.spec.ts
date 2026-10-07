import { validate } from 'class-validator';
import { ChangeAppointmentStatusDto } from '../dto/change-appointment-status.dto';

describe('appointment status request validation', () => {
  it.each(['CONFIRMED', 'COMPLETED', 'NO_SHOW'])('accepts %s', async (status) => {
    expect(await validate(Object.assign(new ChangeAppointmentStatusDto(), { status }))).toEqual([]);
  });

  it.each(['PENDING', 'CANCELLED', 'unknown', undefined, null])('rejects %s so cancellation cannot bypass its lifecycle', async (status) => {
    expect(await validate(Object.assign(new ChangeAppointmentStatusDto(), { status }))).not.toEqual([]);
  });
});
