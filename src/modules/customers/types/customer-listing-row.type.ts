export interface CustomerListingRow {
  id: string;
  name: string;
  phoneNumber: string;
  phoneCountryCode: string;
  email: string | null;
  notes: string | null;
  blockedAt: Date | null;
  firstAppointmentAt: Date | null;
  lastAppointmentAt: Date | null;
  lastVisitAt: Date | null;
  nextAppointmentAt: Date | null;
  totalSpent: string;
}
