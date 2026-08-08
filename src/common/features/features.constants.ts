export type Feature =
  | 'booking-page'
  | 'basic-analytics'
  | 'advanced-analytics'
  | 'reminders'
  | 'multi-professional'
  | 'reports'
  | 'priority-support'
  | 'custom-branding'
  | 'no-ads';

export const PLAN_FEATURES = {
  FREE: ['booking-page', 'basic-analytics'],
  PRO: ['booking-page', 'basic-analytics', 'advanced-analytics', 'reminders', 'priority-support', 'custom-branding', 'no-ads'],
  TEAM: [
    'booking-page',
    'basic-analytics',
    'advanced-analytics',
    'reminders',
    'priority-support',
    'multi-professional',
    'reports',
    'custom-branding',
    'no-ads',
  ],
};
