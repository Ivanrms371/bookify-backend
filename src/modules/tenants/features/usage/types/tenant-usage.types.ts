export type UsageMetric = { count: number; limit: number; percentage: number };
export type ResourceLimits = { professionals: number | null; services: number | null };
export type CatalogLimits = ResourceLimits;
// Null enforced limits mean creation is unrestricted by the current policy.
export type EnforcedLimits = ResourceLimits;
export type ResourceUsage = { professionals: number; services: number; countBasis: 'non_deleted' };
export type ResourceUsageMetric = { count: number; limit: number | null; percentage: number | null };
export type NotificationLimits = { emailLimit: number; whatsappLimit: number };
export type MonthlyUsageStatus = { emails: UsageMetric; whatsapp: UsageMetric; appointments: UsageMetric };
export type TenantUsageStatus = MonthlyUsageStatus & {
  professionals: ResourceUsageMetric;
  services: ResourceUsageMetric;
  catalogLimits: CatalogLimits;
  enforcedLimits: EnforcedLimits;
};
export type TenantUsagePeriod = { tenantId: string; periodMonth: number; periodYear: number };
