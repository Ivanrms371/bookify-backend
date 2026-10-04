import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProfessionalStepDto } from './professional-step.dto';
const validatePayload = (value: object) => validate(plainToInstance(ProfessionalStepDto, value));
describe('professional step validation', () => {
  it('allows a manager without professional fields', async () => {
    expect(await validatePayload({ attendsClients: false })).toEqual([]);
  });
  it('requires an explicit choice', async () => {
    expect(await validatePayload({})).not.toEqual([]);
  });
  it('requires professional contact details and a service', async () => {
    const errors = await validatePayload({ attendsClients: true });
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'email', 'phoneCountryCode', 'phoneNumber', 'serviceIds']),
    );
  });
  it('accepts a complete profile and rejects duplicate service IDs', async () => {
    const value = {
      attendsClients: true,
      name: 'Owner',
      email: 'owner@example.com',
      phoneCountryCode: '+598',
      phoneNumber: '99123456',
      serviceIds: ['123e4567-e89b-42d3-a456-426614174000'],
    };
    expect(await validatePayload(value)).toEqual([]);
    expect(await validatePayload({ ...value, serviceIds: [...value.serviceIds, ...value.serviceIds] })).not.toEqual([]);
  });
});
