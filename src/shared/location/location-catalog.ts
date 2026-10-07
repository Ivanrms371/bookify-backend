import { LOCATION_COUNTRIES } from './data/countries';
import { LocationInvalidException } from './location.exception';
import type { LocationDefaults } from './types/location.types';

export { LOCATION_COUNTRIES };
export const LOCATION_CURRENCIES = [...new Set(['USD', ...LOCATION_COUNTRIES.flatMap((country) => country.currencies)])].sort();
export const LOCATION_TIME_ZONES = [...new Set(['Etc/UTC', ...LOCATION_COUNTRIES.flatMap((country) => country.timeZones)])].sort();
const normalize = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function getLocationCountry(country: string) {
  const selected = LOCATION_COUNTRIES.find(
    (option) => option.code === country.trim().toUpperCase() || normalize(option.label) === normalize(country),
  );
  if (!selected) throw new LocationInvalidException('Seleccioná un país válido');
  return selected;
}

export function resolveLocationRegion(country: string, province: string) {
  const selected = getLocationCountry(country);
  if (!selected.regions.length) return { value: province.trim(), label: province.trim(), timeZone: '' };
  const region = selected.regions.find((option) => normalize(option.value) === normalize(province));
  if (!region) throw new LocationInvalidException('Seleccioná un departamento o provincia del país elegido');
  return region;
}

export function resolveLocationSelection(country: string, province?: string | null): LocationDefaults {
  const selected = getLocationCountry(country);
  const region = province ? resolveLocationRegion(selected.code, province) : null;
  return {
    currency: selected.currency!,
    timeZone: region?.timeZone || selected.defaultTimeZone!,
  };
}

// Preserve defaults for legacy unfinished tenants with no saved location selection.
export function resolveLocationDefaults(country?: string | null, province?: string | null): LocationDefaults {
  // Unsupported historical drafts must still load so the owner can choose a supported country.
  const selected =
    LOCATION_COUNTRIES.find(
      (option) => normalize(option.code) === normalize(country || '') || normalize(option.label) === normalize(country || ''),
    ) ?? getLocationCountry('UY');
  const region = selected.regions.find((option) => province && normalize(option.value) === normalize(province));
  return {
    currency: selected.currency || 'USD',
    timeZone: region?.timeZone || selected.defaultTimeZone || selected.timeZones[0] || 'Etc/UTC',
  };
}

export function getLocationOptions() {
  return { countries: LOCATION_COUNTRIES, currencies: LOCATION_CURRENCIES, timeZones: LOCATION_TIME_ZONES };
}
