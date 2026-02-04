export interface MercadoPagoPaymentSearchResponse {
  results: MercadoPagoPayment[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

export interface MercadoPagoPayment {
  id: number;
  status: 'approved' | 'pending' | 'rejected' | string;
  status_detail: string;

  description: string;
  external_reference: string;

  transaction_amount: number;
  transaction_amount_refunded: number;
  currency_id: string;

  date_created: string;
  date_approved: string | null;
  date_last_updated: string;

  operation_type: 'recurring_payment' | string;
  payment_method_id: string;
  payment_type_id: string;

  installments: number;
  captured: boolean;
  live_mode: boolean;
  binary_mode: boolean;

  payer: MercadoPagoPayer;
  charges_details: MercadoPagoChargeDetail[];
  fee_details: MercadoPagoFeeDetail[];
  transaction_details: MercadoPagoTransactionDetails;

  money_release_date: string | null;
  money_release_status: 'pending' | 'released' | string;

  point_of_interaction: MercadoPagoPointOfInteraction;

  metadata: Record<string, any>;
}

export interface MercadoPagoPayer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  entity_type: string | null;

  identification: {
    type: string;
    number: string;
  };

  phone: {
    area_code: string | null;
    number: string | null;
    extension: string | null;
  };
}

export interface MercadoPagoFeeDetail {
  type: 'mercadopago_fee' | string;
  amount: number;
  fee_payer: 'collector' | 'payer' | string;
}
export interface MercadoPagoChargeDetail {
  id: string;
  name: string;
  type: 'fee' | string;
  rate: number;

  base_amount: number;
  date_created: string;
  last_updated: string;

  amounts: {
    original: number;
    refunded: number;
  };

  metadata: {
    source: string;
    source_detail: string;
    reason: string;
  };
}

export interface MercadoPagoTransactionDetails {
  total_paid_amount: number;
  net_received_amount: number;
  installment_amount: number;
  overpaid_amount: number;
}

export interface MercadoPagoPointOfInteraction {
  type: 'SUBSCRIPTIONS' | string;

  transaction_data: {
    subscription_id: string;
    billing_date: string;
    first_time_use: boolean;

    invoice_period: {
      period: number;
      type: 'monthly' | string;
    };

    subscription_sequence: {
      number: number;
      total: number;
    };
  };
}
