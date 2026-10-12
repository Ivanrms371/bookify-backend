import type { BillingNoticeStateService } from '../billing-notice-state.service';

export type BillingNoticeState = NonNullable<Awaited<ReturnType<BillingNoticeStateService['findState']>>>;
