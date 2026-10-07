import { LocationStepDto } from './location-step.dto';
import { validationPipe } from 'src/config/configuration';

const parse = (value: unknown) => validationPipe.transform(value, { type: 'body', metatype: LocationStepDto });
const valid = { country: 'UY', province: 'Montevideo', city: 'Montevideo', addressLine1: '18 de Julio 1234' };

describe('onboarding location request', () => {
  it('normalizes country and text and allows optional contact/complement', async () => {
    await expect(parse({ ...valid, country: ' uy ', city: ' Montevideo ', phoneNumber: ' ' })).resolves.toMatchObject({
      ...valid,
      phoneNumber: null,
    });
  });
  it.each([
    { country: 'XX' },
    { country: 'US' },
    { country: null },
    { province: '' },
    { city: '  ' },
    { addressLine1: '' },
    { addressLine1: 'a'.repeat(201) },
    { city: [] },
    { phoneNumber: 'not a phone' },
    { phoneNumber: '()------' },
    { phoneNumber: '123' },
    { phoneNumber: '1234567890123456' },
    { tenantId: 'foreign' },
    { department: 'Montevideo' },
  ])('rejects malformed/extra fields: %s', async (overrides) => {
    await expect(parse({ ...valid, ...overrides })).rejects.toMatchObject({ status: 400 });
  });
  it('accepts a free-text city without geocoding and a locally formatted phone', async () => {
    await expect(parse({ ...valid, city: 'Mi localidad', phoneNumber: '+598 (99) 123-456', addressLine2: null })).resolves.toMatchObject({
      city: 'Mi localidad',
      phoneNumber: '+598 (99) 123-456',
      addressLine2: null,
    });
  });
});
