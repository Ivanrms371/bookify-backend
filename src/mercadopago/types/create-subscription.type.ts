export type MercadoPagoAutoRecurringSubscription = {
  currency_id: string;
  transaction_amount: number;
  frequency: number;
  frequency_type: 'days' | 'months' | 'years';
  start_date: string;
  end_date: string;
};

export type MercadoPagoCreateSubscriptionRequest = {
  auto_recurring: MercadoPagoAutoRecurringSubscription;
  back_url?: string;
  external_reference: string;
  payer_email: string;
  reason: string;
};

export type MercadoPagoSubscriptionStatus = 'pending' | 'authorized' | 'paused' | 'cancelled';

export interface MercadoPagoAutoRecurring {
  frequency: number;
  frequency_type: 'days' | 'months';
  transaction_amount: number;
  currency_id: 'UYU' | 'ARS' | 'USD';
  start_date: string; // ISO date
  end_date?: string; // ISO date
  free_trial: {
    frequency: number;
    frequency_type: 'days' | 'months';
  } | null;
}

export interface MercadoPagoSummarized {
  quotas: number | null;
  charged_quantity: number | null;
  pending_charge_quantity: number | null;
  charged_amount: number | null;
  pending_charge_amount: number | null;
  semaphore: string | null;
  last_charged_date: string | null;
  last_charged_amount: number | null;
}

export interface MercadoPagoSubscriptionResponse {
  id: string;
  subscription_id: string;

  payer_id: number;
  payer_email: string;

  collector_id: number;
  application_id: number;

  status: MercadoPagoSubscriptionStatus;
  reason: string;
  external_reference: string;

  back_url: string;
  init_point: string;

  date_created: string;
  last_modified: string;
  next_payment_date: string;

  auto_recurring: MercadoPagoAutoRecurring;
  summarized: MercadoPagoSummarized;

  payment_method_id: string | null;
  payment_method_id_secondary: string | null;
  first_invoice_offset: number | null;

  owner: unknown | null;
  rollout_unification_api_public: boolean;
}
