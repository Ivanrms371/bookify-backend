import { PublicService } from '../public.service';
import { PublicController } from '../public.controller';
import { CustomerVerificationDto, VerifyCustomerVerificationDto } from '../dto/customer-verification.dto';
import { CreatePublicAppointmentDto } from '../dto/create-public-appointment.dto';
import { validate } from 'class-validator';

it('persists identity before OTP work and returns only verification metadata', async () => {
  const customer = { id: 'customer', name: 'PRIVATE', notes: 'PRIVATE' };
  const customers = { findPublicByPhoneOrCreate: jest.fn().mockResolvedValue(customer) };
  const verification = { customerId: 'customer', verificationRequired: true, verificationId: 'verification' };
  const verifications = { requestCustomerVerification: jest.fn().mockResolvedValue(verification) };
  const service = new PublicService(
    customers as never,
    verifications as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const dto = {
    tenantId: 'tenant',
    name: 'New',
    email: 'new@example.test',
    phoneCountryCode: '598',
    phoneNumber: '99123456',
    notes: 'notes',
  };
  expect(await service.requestCustomerVerification(dto)).toEqual(verification);
  expect(customers.findPublicByPhoneOrCreate).toHaveBeenCalledWith('tenant', {
    name: 'New',
    email: 'new@example.test',
    phoneCountryCode: '598',
    phoneNumber: '99123456',
    notes: 'notes',
  });
  expect(customers.findPublicByPhoneOrCreate.mock.invocationCallOrder[0]).toBeLessThan(
    verifications.requestCustomerVerification.mock.invocationCallOrder[0],
  );
  expect(verifications.requestCustomerVerification).toHaveBeenCalledWith('tenant', 'customer', dto.email);
  verifications.requestCustomerVerification.mockRejectedValue(new Error('delivery unavailable'));
  await expect(service.requestCustomerVerification(dto)).rejects.toThrow('delivery unavailable');
  expect(customers.findPublicByPhoneOrCreate).toHaveBeenCalledTimes(2);
});
it('delegates OTP validation by verification ID and public appointment mutations', async () => {
  const verifications = { verifyCustomerCode: jest.fn().mockResolvedValue({ success: true }) };
  const service = { createAppointment: jest.fn(), rescheduleAppointment: jest.fn(), cancelAppointment: jest.fn() };
  const controller = new PublicController(service as never, verifications as never);
  await controller.verifyCustomerVerification({ verificationId: 'v', code: '123456' });
  expect(verifications.verifyCustomerCode).toHaveBeenCalledWith('v', '123456');
  await controller.createAppointment({} as never);
  await controller.rescheduleAppointment('token', {} as never);
  await controller.cancelAppointment('token', {} as never);
  expect(service.createAppointment).toHaveBeenCalledWith({});
  expect(service.rescheduleAppointment).toHaveBeenCalledWith('token', {});
  expect(service.cancelAppointment).toHaveBeenCalledWith('token', {});
});
it('validates public OTP and customer-ID contracts', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  expect(await validate(Object.assign(new VerifyCustomerVerificationDto(), { verificationId: id, code: '123456' }))).toHaveLength(0);
  expect(await validate(Object.assign(new VerifyCustomerVerificationDto(), { verificationId: id, code: 'abcdef' }))).not.toHaveLength(0);
  const booking = Object.assign(new CreatePublicAppointmentDto(), {
    customerId: id,
    tenantId: id,
    serviceId: id,
    professionalId: id,
    startsAt: '2030-01-01T12:00:00Z',
  });
  expect(await validate(booking)).toHaveLength(0);
  delete booking.customerId;
  expect((await validate(booking)).some((error) => error.property === 'customerId')).toBe(true);
});
