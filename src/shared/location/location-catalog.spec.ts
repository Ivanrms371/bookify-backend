import {
  resolveLocationDefaults,
  resolveLocationRegion,
  resolveLocationSelection,
  getLocationOptions,
} from 'src/shared/location/location-catalog';
import { LOCATION_COUNTRIES } from 'src/shared/location/data/countries';

describe('shared country and region options', () => {
  it('offers all 19 Uruguay departments and 23 Argentina provinces plus CABA', () => {
    expect(
      LOCATION_COUNTRIES.filter((country) => ['UY', 'AR'].includes(country.code))
        .sort((a, b) => b.code.localeCompare(a.code))
        .map((country) => [country.code, country.regions.length]),
    ).toEqual([
      ['UY', 19],
      ['AR', 24],
    ]);
  });
  it('derives the Uruguay defaults and preserves legacy missing-country defaults', () => {
    expect(resolveLocationDefaults('UY', 'Montevideo')).toEqual({ currency: 'UYU', timeZone: 'America/Montevideo' });
    expect(resolveLocationDefaults()).toEqual({ currency: 'UYU', timeZone: 'America/Montevideo' });
    expect(resolveLocationDefaults('US', 'California')).toEqual({ currency: 'UYU', timeZone: 'America/Montevideo' });
  });
  it.each([
    ['Buenos Aires', 'Buenos_Aires'],
    ['Ciudad Autónoma de Buenos Aires', 'Buenos_Aires'],
    ['Córdoba', 'Cordoba'],
    ['Mendoza', 'Mendoza'],
    ['Tierra del Fuego', 'Ushuaia'],
    ['Chubut', 'Catamarca'],
    ['Neuquén', 'Salta'],
  ])('derives Argentina currency and timezone for %s', (province, zone) => {
    expect(resolveLocationDefaults('AR', province)).toEqual({ currency: 'ARS', timeZone: `America/Argentina/${zone}` });
  });
  it('normalizes accents and case to a canonical region name', () => {
    expect(resolveLocationRegion(' ar ', ' cordoba ').value).toBe('Córdoba');
  });
  it('rejects unknown countries and country/region mismatches', () => {
    expect(() => resolveLocationSelection('XX')).toThrow('país válido');
    expect(() => resolveLocationSelection('AR', 'Montevideo')).toThrow('país elegido');
  });
  it('all configured timezone identifiers are recognized by the runtime', () => {
    for (const country of LOCATION_COUNTRIES)
      for (const region of country.regions.filter((region) => region.timeZone))
        expect(() => new Intl.DateTimeFormat('es', { timeZone: region.timeZone })).not.toThrow();
  });
});

describe('supported location selection', () => {
  it('offers only the five supported countries and regions', () => {
    expect(getLocationOptions().countries.map((country) => country.code)).toEqual(['UY', 'AR', 'PE', 'CL', 'PY']);
    expect(getLocationOptions().countries.map((country) => country.regions.length)).toEqual([19, 24, 25, 16, 18]);
    for (const code of ['US', 'BR', 'DE', 'JP']) expect(() => resolveLocationSelection(code)).toThrow('país válido');
  });
  it.each([
    ['PE', 'Lima', 'PEN', 'America/Lima'],
    ['PY', 'Asunción', 'PYG', 'America/Asuncion'],
    ['CL', 'Metropolitana de Santiago', 'CLP', 'America/Santiago'],
    ['CL', 'Magallanes y de la Antártica Chilena', 'CLP', 'America/Punta_Arenas'],
    ['CL', 'Aysén del General Carlos Ibáñez del Campo', 'CLP', 'America/Punta_Arenas'],
  ])('derives preferences for %s / %s', (country, region, currency, timeZone) => {
    expect(resolveLocationSelection(country, region)).toEqual({ currency, timeZone });
  });
  it('uses mainland Chile as the default for Valparaíso', () => {
    expect(resolveLocationSelection('CL', 'Valparaíso')).toEqual({ currency: 'CLP', timeZone: 'America/Santiago' });
  });
  it.each([
    ['UY', 'UYU', 'America/Montevideo'],
    ['AR', 'ARS', 'America/Argentina/Buenos_Aires'],
    ['PE', 'PEN', 'America/Lima'],
    ['CL', 'CLP', 'America/Santiago'],
    ['PY', 'PYG', 'America/Asuncion'],
  ])('derives both defaults from country %s alone', (country, currency, timeZone) => {
    expect(resolveLocationSelection(country)).toEqual({ currency, timeZone });
  });
});
