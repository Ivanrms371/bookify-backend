export type TenantUsageFindInput = {
  tenantId: string;
  periodMonth: number;
  periodYear: number;
};
export type TenantUsageUpsertInput = {
  appointmentLimit: number;
  emailLimit: number;
  whatsappLimit: number;
};

export type TenantUsageStatus = {
  emails: {
    count: number;
    limit: number;
    percentage: number;
  };
  whatsapp: {
    count: number;
    limit: number;
    percentage: number;
  };
  appointments: {
    count: number;
    limit: number;
    percentage: number;
  };
};
