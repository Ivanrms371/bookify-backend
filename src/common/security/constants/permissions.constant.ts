export const PERMISSIONS = {
  // Bookings
  APPOINTMENT_CREATE: 'appointment:create',
  APPOINTMENT_READ: 'appointment:read',
  APPOINTMENT_UPDATE: 'appointment:update',
  APPOINTMENT_DELETE: 'appointment:delete',

  APPOINTMENT_READ_OTHERS: 'appointment:read_others',
  APPOINTMENT_UPDATE_OTHERS: 'appointment:update_others',
  APPOINTMENT_DELETE_OTHERS: 'appointment:delete_others',

  // Customers
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  // Services
  SERVICE_CREATE: 'service:create',
  SERVICE_READ: 'service:read',
  SERVICE_UPDATE: 'service:update',
  SERVICE_DELETE: 'service:delete',

  // Professionals
  PROFESSIONAL_READ: 'professional:read',
  PROFESSIONAL_CREATE: 'professional:create',
  PROFESSIONAL_UPDATE: 'professional:update',
  PROFESSIONAL_DELETE: 'professional:delete',

  // Staff
  TEAM_READ: 'team:read',
  TEAM_INVITE: 'team:invite',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',
  SCHEDULE_READ: 'schedule:read',
  SCHEDULE_UPDATE: 'schedule:update',

  // Tenant
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',

  // Reports
  REPORT_READ: 'report:read',

  // Billing
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
