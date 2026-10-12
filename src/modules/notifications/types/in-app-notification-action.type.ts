export type InAppNotificationAction =
  | {
      version: 1;
      kind: 'APPOINTMENT';
      appointmentId: string;
    }
  | { version: 1; kind: 'CALENDAR'; date?: string; professionalId?: string }
  | { version: 1; kind: 'BILLING'; destination: 'PLANS' | 'OVERVIEW' }
  | { version: 1; kind: 'BUSINESS' }
  | { version: 1; kind: 'TEAM' };
