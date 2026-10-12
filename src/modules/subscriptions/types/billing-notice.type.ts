export const BILLING_NOTICE_TYPES = ['billing.trial.ends.7d', 'billing.trial.ends.3d', 'billing.renewal.3d'] as const;

export type BillingNoticeType = (typeof BILLING_NOTICE_TYPES)[number];

export type BillingNoticeVariables = {
  businessName: string;
  eventAt: string;
  endDate: string;
  endTime: string;
  timeZone: string;
  dueDate: string;
  actionUrl?: string;
  actionPath?: string;
};
