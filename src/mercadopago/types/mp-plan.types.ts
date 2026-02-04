export type MercadoPagoCreatePlanRequest = {
  auto_recurring: {
    frequency: number;
    frequency_type: 'days' | 'months' | 'years';
    transaction_amount: number;
    currency_id: string;
    // start_date: string;
    // end_date: string;
  };
  reason: string;
  back_url: string;
  status: 'active' | 'paused';
  external_reference: string;
};

export type MercadoPagoFreeTrial = {
  frequency: number;
  frequency_type: 'days' | 'months' | 'years';
  first_invoice_offset: number;
};

export type MercadoPagoAutoRecurring = {
  frequency: number;
  frequency_type: 'days' | 'months' | 'years';
  transaction_amount: number;
  currency_id: string;
  repetitions?: number;
  free_trial?: MercadoPagoFreeTrial;
  billing_day?: number;
  billing_day_proportional?: boolean;
};

export type MercadoPagoPaymentType = {
  id: string;
};

export type MercadoPagoPaymentMethod = {
  id: string;
};

export type MercadoPagoPaymentMethodsAllowed = {
  payment_types: MercadoPagoPaymentType[];
  payment_methods: MercadoPagoPaymentMethod[];
};

export type MercadoPagoCreatePlanResponse = {
  id: string;
  back_url?: string;
  collector_id: number;
  application_id: number;
  reason: string;
  status: 'active' | 'paused';
  external_reference?: string;
  date_created: string; // ISO8601
  last_modified: string; // ISO8601
  init_point: string; // URL de checkout
  auto_recurring: MercadoPagoAutoRecurring;
  payment_methods_allowed: MercadoPagoPaymentMethodsAllowed;
};
