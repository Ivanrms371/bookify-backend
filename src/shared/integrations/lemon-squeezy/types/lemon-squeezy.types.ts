/**
 * Official events emitted by Lemon Squeezy webhooks.
 */
export type LemonSqueezyWebhookEvent =
  // Orders
  | 'order_created'
  | 'order_refunded'
  // Subscriptions
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  // Subscription Invoices and Payments
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered'
  // Plans
  | 'subscription_plan_changed';

export type LemonSqueezySubscriptionStatus = 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';

export interface CreateCheckoutParams {
  variantId: string;
  userEmail: string;
  userName?: string;
  tenantId: string;
  redirectUrl?: string;
}

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: LemonSqueezyWebhookEvent;
    custom_data?: {
      tenant_id?: string;
      [key: string]: unknown;
    };
  };
  data: {
    id: string;
    type: 'subscriptions';
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
      status: LemonSqueezySubscriptionStatus;
      status_formatted: string;
      card_brand: string | null;
      card_last_four: string | null;
      pause: boolean | null;
      cancelled: boolean;
      trial_ends_at: string | null;
      billing_anchor: number;
      urls: {
        update_payment_method: string;
        customer_portal: string;
      };
      renews_at: string | null;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
    };
  };
}

// src/shared/integrations/lemon-squeezy/lemon-squeezy.types.ts

export interface LemonCheckoutAttributes {
  store_id: number;
  variant_id: number;
  custom_price: number | null;
  product_options: {
    name?: string;
    description?: string;
    media?: string[];
    redirect_url?: string;
    receipt_button_text?: string;
    receipt_link_url?: string;
    receipt_thank_you_note?: string;
    enabled_variants?: number[];
  };
  checkout_options: {
    embed?: boolean;
    media?: boolean;
    logo?: boolean;
    desc?: boolean;
    discount?: boolean;
    dark?: boolean;
    subscription_preview?: boolean;
    button_color?: string;
  };
  checkout_data: {
    email?: string;
    name?: string;
    billing_address?: {
      country?: string;
      zip?: string;
    };
    tax_number?: string;
    discount_code?: string;
    custom?: {
      tenant_id?: string;
      [key: string]: unknown;
    };
    variant_quantities?: Record<string, number>;
  };
  preview: {
    currency: string;
    currency_rate: number;
    subtotal: number;
    discount_total: number;
    tax: number;
    total: number;
    subtotal_usd: number;
    discount_total_usd: number;
    tax_usd: number;
    total_usd: number;
    subtotal_formatted: string;
    discount_total_formatted: string;
    tax_formatted: string;
    total_formatted: string;
  };
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
  url: string; // URL pública firmada de la sesión de checkout
}

export interface LemonCheckoutResponse {
  jsonapi: {
    version: string;
  };
  links: {
    self: string;
  };
  data: {
    type: 'checkouts';
    id: string;
    attributes: LemonCheckoutAttributes;
    relationships: {
      store: {
        links: {
          related: string;
          self: string;
        };
      };
      variant: {
        links: {
          related: string;
          self: string;
        };
      };
    };
  };
}

// src/shared/integrations/lemon-squeezy/lemon-squeezy.types.ts

export interface LemonCustomerAttributes {
  store_id: number;
  name: string;
  email: string;
  status: 'subscribed' | 'unsubscribed' | 'archived';
  city: string | null;
  region: string | null;
  country: string | null;
  country_formatted: string | null;
  total_revenue_currency: number;
  mrr: number;
  status_formatted: string;
  total_revenue_currency_formatted: string;
  mrr_formatted: string;
  urls: {
    customer_portal: string;
  };
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

export interface LemonCustomerResponse {
  jsonapi: {
    version: string;
  };
  links: {
    self: string;
  };
  data: {
    type: 'customers';
    id: string;
    attributes: LemonCustomerAttributes;
    relationships?: {
      store?: {
        links: {
          related: string;
          self: string;
        };
      };
      subscriptions?: {
        links: {
          related: string;
          self: string;
        };
      };
      orders?: {
        links: {
          related: string;
          self: string;
        };
      };
    };
  };
}
