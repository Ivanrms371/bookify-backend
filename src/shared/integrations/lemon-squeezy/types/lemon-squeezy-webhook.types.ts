// src/shared/integrations/lemon-squeezy/lemon-squeezy.types.ts

import { LemonSqueezySubscriptionStatus } from './lemon-squeezy.types';

export type LemonSqueezyWebhookEvent =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_failed'
  | 'subscription_payment_success'
  | 'subscription_payment_recovered'
  | 'subscription_payment_refunded';

export interface LemonSqueezyWebhookCustomData {
  tenant_id?: string;
  [key: string]: unknown;
}

export interface LemonSqueezyWebhookMeta {
  test_mode: boolean;
  event_name: LemonSqueezyWebhookEvent;
  webhook_id: string;
  custom_data?: LemonSqueezyWebhookCustomData;
}

export interface LemonSqueezySubscriptionUrls {
  update_payment_method?: string;
  customer_portal?: string;
  customer_portal_update_subscription?: string;
}

export interface LemonSqueezyFirstSubscriptionItem {
  id: number;
  subscription_id: number;
  price_id: number;
  quantity: number;
  is_usage_based: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface LemonSqueezyRelationshipLink {
  links: {
    related: string;
    self: string;
  };
}

export interface LemonSqueezySubscriptionRelationships {
  store: LemonSqueezyRelationshipLink;
  customer: LemonSqueezyRelationshipLink;
  order: LemonSqueezyRelationshipLink;
  'order-item': LemonSqueezyRelationshipLink;
  product: LemonSqueezyRelationshipLink;
  variant: LemonSqueezyRelationshipLink;
  'subscription-items': LemonSqueezyRelationshipLink;
  'subscription-invoices': LemonSqueezyRelationshipLink;
}

export interface LemonSqueezySubscriptionAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status: LemonSqueezySubscriptionStatus;
  status_formatted: string;
  card_brand: string | null;
  card_last_four: string | null;
  pause: Record<string, unknown> | null;
  cancelled: boolean;
  trial_ends_at: string | null;
  billing_anchor: number;
  urls: LemonSqueezySubscriptionUrls;
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
  payment_processor: string;
  first_subscription_item?: LemonSqueezyFirstSubscriptionItem | null;
}

export interface LemonSqueezySubscriptionData {
  id: string;
  type: 'subscriptions';
  links: {
    self: string;
  };
  attributes: LemonSqueezySubscriptionAttributes;
  relationships?: LemonSqueezySubscriptionRelationships;
}

export interface LemonSqueezyInvoiceData {
  id: string;
  type: 'subscription-invoices';
  attributes: {
    store_id: number; subscription_id: number; customer_id: number; test_mode: boolean;
    status: 'pending' | 'paid' | 'void' | 'refunded' | 'partial_refund';
    currency: string; total: number; refunded_amount: number;
    urls?: { invoice_url: string | null };
    created_at: string; updated_at: string;
  };
}

export interface LemonSqueezyWebhookPayload {
  meta: LemonSqueezyWebhookMeta;
  data: LemonSqueezySubscriptionData | LemonSqueezyInvoiceData;
}
