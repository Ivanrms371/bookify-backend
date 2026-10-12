import { AppointmentCreatedListener } from '../listeners/appointments/appointment-created.listener';
import { AppointmentRescheduledListener } from '../listeners/appointments/appointment-rescheduled.listener';
import { AppointmentCancelledListener } from '../listeners/appointments/appointment-cancelled.listener';
import { NotificationConfigService } from '../notification-config.service';
import { RecipientType } from 'src/generated/prisma/enums';

jest.mock('../application/services/notifications.service', () => ({ NotificationsService: jest.fn() }));
const event = {
  tenantId: 'tenant',
  appointmentId: 'appointment',
  professionalId: 'professional',
  professionalName: 'Ana',
  customerId: 'customer',
  customerName: 'Luis',
  userId: null,
  serviceId: 'service',
  serviceName: 'Corte',
  startAppointmentDate: new Date('2030-10-15T14:00:00Z'),
  endAppointmentDate: new Date('2030-10-15T14:30:00Z'),
  startsAt: new Date('2030-10-15T14:00:00Z'),
  endsAt: new Date('2030-10-15T14:30:00Z'),
  previousStartsAt: new Date('2030-10-14T14:00:00Z'),
  previousEndsAt: new Date('2030-10-14T14:30:00Z'),
  cancelUrl: 'https://booking.example/cancel/token',
  rescheduleUrl: 'https://booking.example/reschedule/token',
  rescheduledByName: 'Luis',
  cancelledByName: 'Luis',
  cancellationReason: '',
  status: 'CONFIRMED',
};
function fixture() {
  const notifications = { create: jest.fn().mockResolvedValue({}), cancelScheduledDeliveries: jest.fn() };
  const appointments = {
    findById: jest.fn().mockResolvedValue({
      ...event,
      createdBy: 'CUSTOMER',
      timeZone: 'America/Montevideo',
      professionalDetailsUrl: 'https://dashboard.example/business/calendar?notificationAppointmentId=appointment',
    }),
  };
  return {
    notifications,
    appointments,
    created: new AppointmentCreatedListener(notifications as never, appointments as never),
    rescheduled: new AppointmentRescheduledListener(notifications as never, appointments as never),
    cancelled: new AppointmentCancelledListener(notifications as never, appointments as never),
    immediate: () => notifications.create.mock.calls.map(([value]) => value).filter((value) => !value.executeAt),
    reminders: () => notifications.create.mock.calls.map(([value]) => value).filter((value) => value.executeAt),
  };
}
it.each(['CUSTOMER', 'STAFF'] as const)('routes a booking created by %s', async (createdBy) => {
  const f = fixture();
  f.appointments.findById.mockResolvedValue({ ...(await f.appointments.findById()), createdBy });
  await f.created.handle({ tenantId: 'tenant', appointmentId: 'appointment' });
  expect(f.immediate()).toEqual(
    createdBy === 'CUSTOMER'
      ? [
          expect.objectContaining({
            recipientId: 'professional',
            recipientType: 'PROFESSIONAL',
            payload: expect.objectContaining({ audience: 'PROFESSIONAL', createdBy }),
          }),
          expect.objectContaining({
            recipientId: 'customer',
            recipientType: 'CUSTOMER',
            payload: expect.objectContaining({ audience: 'CUSTOMER', createdBy }),
          }),
        ]
      : [
          expect.objectContaining({
            recipientId: 'customer',
            recipientType: 'CUSTOMER',
            payload: expect.objectContaining({ audience: 'CUSTOMER', createdBy }),
          }),
        ],
  );
  expect(f.reminders()).toHaveLength(2);
  expect(f.reminders().every((value) => value.recipientId === 'customer' && value.type === 'appointment.reminder')).toBe(true);
});
it.each(['CUSTOMER', 'USER'] as const)('routes rescheduling by %s and replaces reminders', async (rescheduledBy) => {
  const f = fixture();
  await f.rescheduled.handle({ ...event, rescheduledBy });
  const audience = rescheduledBy === 'CUSTOMER' ? 'PROFESSIONAL' : 'CUSTOMER';
  expect(f.immediate()).toEqual([
    expect.objectContaining({
      recipientId: audience === 'PROFESSIONAL' ? 'professional' : 'customer',
      recipientType: audience,
      referenceId: 'appointment',
      type: 'appointment.rescheduled',
      payload: expect.objectContaining({ audience }),
    }),
  ]);
  expect(f.notifications.cancelScheduledDeliveries).toHaveBeenCalledWith('appointment', 'appointment.reminder');
  expect(f.reminders()).toHaveLength(2);
});
it.each(['CUSTOMER', 'USER'] as const)('routes cancellation by %s and cancels reminders', async (cancelledBy) => {
  const f = fixture();
  f.appointments.findById.mockResolvedValue({ ...(await f.appointments.findById()), status: 'CANCELLED' });
  await f.cancelled.handle({ ...event, cancelledBy });
  const audience = cancelledBy === 'CUSTOMER' ? 'PROFESSIONAL' : 'CUSTOMER';
  expect(f.immediate()).toEqual([
    expect.objectContaining({
      recipientId: audience === 'PROFESSIONAL' ? 'professional' : 'customer',
      recipientType: audience,
      referenceId: 'appointment',
      type: 'appointment.cancelled',
      payload: expect.objectContaining({ audience }),
    }),
  ]);
  expect(f.notifications.cancelScheduledDeliveries).toHaveBeenCalledWith('appointment', 'appointment.reminder');
  expect(f.reminders()).toHaveLength(0);
});
it('does not let a missing customer prevent reminder cleanup on rescheduling', async () => {
  const f = fixture();
  f.appointments.findById.mockResolvedValue({ ...(await f.appointments.findById()), customerId: null });
  await f.rescheduled.handle({ ...event, rescheduledBy: 'USER' });
  expect(f.notifications.cancelScheduledDeliveries).toHaveBeenCalledWith('appointment', 'appointment.reminder');
  expect(f.notifications.create).not.toHaveBeenCalled();
});
it('does not schedule reminders in the past', async () => {
  const f = fixture();
  f.appointments.findById.mockResolvedValue({ ...(await f.appointments.findById()), startsAt: new Date('2020-01-01T12:00:00Z') });
  await f.created.handle({ tenantId: 'tenant', appointmentId: 'appointment' });
  expect(f.immediate()).toHaveLength(2);
  expect(f.reminders()).toHaveLength(0);
});
it.each(['appointment.created', 'appointment.rescheduled', 'appointment.cancelled'])(
  'configures professional email and in-app for %s',
  (type) => {
    expect(new NotificationConfigService().getChannels(type, RecipientType.PROFESSIONAL)).toEqual([
      { channel: 'IN_APP' },
      { channel: 'EMAIL', billable: true },
    ]);
  },
);

it('omits unimplemented public action links and uses the real dashboard route only for professionals', async () => {
  const f = fixture();
  await f.created.handle({ tenantId: 'tenant', appointmentId: 'appointment' });
  const [professional, customer] = f.immediate();
  expect(professional.payload.detailsUrl).toBe('https://dashboard.example/business/calendar?notificationAppointmentId=appointment');
  for (const notification of [customer, ...f.reminders()]) {
    expect(notification.payload).not.toHaveProperty('cancelUrl');
    expect(notification.payload).not.toHaveProperty('rescheduleUrl');
    expect(notification.payload).not.toHaveProperty('detailsUrl');
  }
});
it('formats booking, changes and reminders in the business zone, including local date rollover', async () => {
  const f = fixture();
  const startsAt = new Date('2030-10-15T01:00:00Z');
  f.appointments.findById.mockResolvedValue({ ...(await f.appointments.findById()), startsAt });
  await f.created.handle({ tenantId: 'tenant', appointmentId: 'appointment' });
  for (const notification of [...f.immediate(), ...f.reminders()]) {
    expect(notification.payload).toMatchObject({ date: '14 de octubre de 2030', time: '22:00' });
  }
  f.notifications.create.mockClear();
  await f.rescheduled.handle({ ...event, startsAt, previousStartsAt: new Date('2030-10-14T01:00:00Z'), rescheduledBy: 'CUSTOMER' });
  expect(f.immediate()[0].payload).toMatchObject({
    date: '14 de octubre de 2030',
    time: '22:00',
    previousDate: '13 de octubre de 2030',
    previousTime: '22:00',
  });
  f.notifications.create.mockClear();
  f.appointments.findById.mockResolvedValue({ ...(await f.appointments.findById()), status: 'CANCELLED' });
  await f.cancelled.handle({ ...event, cancelledBy: 'USER' });
  expect(f.immediate()[0].payload).toMatchObject({ date: '14 de octubre de 2030', time: '22:00' });
});

it('loads creation details using only tenant and appointment IDs', async () => {
  const f = fixture();
  f.appointments.findById.mockClear();
  await f.created.handle({ tenantId: 'tenant', appointmentId: 'appointment' });
  expect(f.appointments.findById).toHaveBeenCalledWith('tenant', 'appointment');
  expect(f.immediate()[0].payload).toMatchObject({ professionalName: 'Ana', customerName: 'Luis', serviceName: 'Corte' });
});
it.each([null, { status: 'CANCELLED' }, { status: 'COMPLETED' }])('skips obsolete creation notifications: %j', async (appointment) => {
  const f = fixture();
  f.appointments.findById.mockResolvedValue(appointment as never);
  await f.created.handle({ tenantId: 'tenant', appointmentId: 'appointment' });
  expect(f.notifications.create).not.toHaveBeenCalled();
});
it('cleans up reminders but does not recreate them when a rescheduled appointment is now cancelled', async () => {
  const f = fixture();
  f.appointments.findById.mockResolvedValue({ ...event, status: 'CANCELLED' } as never);
  await f.rescheduled.handle({ ...event, rescheduledBy: 'USER' });
  expect(f.notifications.cancelScheduledDeliveries).toHaveBeenCalledWith('appointment', 'appointment.reminder');
  expect(f.notifications.create).not.toHaveBeenCalled();
});
