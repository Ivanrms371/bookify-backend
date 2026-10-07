import type { Tenant, TenantSettings, TenantWorkingHours } from 'src/generated/prisma/client';
import type { BusinessHour } from 'src/shared/schedule';

/**
 * Tenant profile fields returned by getSettings.
 */
export type TenantGeneralProfile = Pick<
  Tenant,
  | 'name'
  | 'slug'
  | 'logoUrl'
  | 'logoPublicId'
  | 'coverUrl'
  | 'coverPublicId'
  | 'phoneNumber'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'province'
  | 'country'
>;

/**
 * Tenant configuration and booking rules settings.
 */
export type TenantAppointmentConfig = Pick<
  TenantSettings,
  | 'slotIntervalMinutes'
  | 'maxAdvancedDays'
  | 'minAdvancedMinutes'
  | 'bufferTimeMinutes'
  | 'cancellationWindowMinutes'
  | 'currency'
  | 'maxPendingApptsPerClient'
  | 'requireConfirmation'
  | 'holidayClosureAutoApply'
  | 'allowPassiveTimeBooking'
  | 'timeZone'
>;

/**
 * Working hours configuration item.
 */
export type TenantWorkingHoursConfig = Pick<TenantWorkingHours, 'dayOfWeek' | 'opensAt' | 'closesAt'>;

/**
 * Raw settings returned by the repository.
 */
export interface RawTenantSettingsResponse extends TenantGeneralProfile {
  settings: TenantAppointmentConfig | null;
  tenantWorkingHours: TenantWorkingHoursConfig[];
}

/**
 * Full settings response returned by getSettings.
 */
export interface TenantSettingsResponse extends TenantGeneralProfile {
  settings: TenantAppointmentConfig | null;
  tenantWorkingHours: BusinessHour[];
}

/**
 * Return type for getAppointmentConfig (full TenantSettings model).
 */
export type TenantAppointmentConfigResponse = TenantSettings;

/**
 * Return type for updateGeneralSettings.
 */
export type UpdateTenantGeneralSettingsResponse = Tenant & { settings: TenantSettings | null };

/**
 * Return type for updateAppointmentSettings.
 */
export type UpdateTenantAppointmentSettingsResponse = Tenant;
