export type LocationDefaults = { currency: string; timeZone: string };
export type LocationRegion = { value: string; label: string; timeZone: string };
export type LocationCountry = {
  code: string;
  label: string;
  currency: string | null;
  currencies: string[];
  defaultTimeZone: string | null;
  timeZones: string[];
  regionLabel: string;
  regions: LocationRegion[];
};
