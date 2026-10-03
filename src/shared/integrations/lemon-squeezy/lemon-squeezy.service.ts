import { LemonPlanChangeError } from './exceptions/lemon-plan-change.error';
import { isInvoiceUrl } from './invoice-url';
import { BadGatewayException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
// src/shared/integrations/lemon-squeezy/lemon-squeezy.service.ts

import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateCheckoutParams, LemonCheckoutResponse, LemonCustomerResponse } from './types/lemon-squeezy.types';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import { LemonSqueezyWebhookPayload, LemonSqueezySubscriptionData, LemonSqueezyInvoiceData } from './types/lemon-squeezy-webhook.types';

@Injectable()
export class LemonSqueezyService {
  private readonly logger = new Logger(LemonSqueezyService.name);
  private readonly http: AxiosInstance;

  private readonly apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  private readonly storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  private readonly webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  private readonly testMode = process.env.LEMON_SQUEEZY_TEST_MODE;

  constructor() {
    this.http = axios.create({
      baseURL: 'https://api.lemonsqueezy.com/v1',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });
  }

  /**
   * Genera la sesión de checkout firmada para un tenant y variante.
   */
  async createCheckout(params: CreateCheckoutParams): Promise<string> {
    if (!this.apiKey || !this.storeId) {
      throw new InternalServerErrorException('Lemon Squeezy credentials are not configured in environment variables.');
    }

    const { variantId, userEmail, userName, tenantId, redirectUrl } = params;

    if (!/^\d+$/.test(variantId) || Number(variantId) <= 0 || !Number.isSafeInteger(Number(variantId)))
      throw new BadRequestException('Invalid provider variant.');

    const checkoutData: Record<string, unknown> = {
      email: userEmail,
      name: userName,
      custom: {
        tenant_id: tenantId,
      },
    };

    const payload = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: checkoutData,
          product_options: { redirect_url: redirectUrl, enabled_variants: [Number(variantId)] },
          checkout_options: { skip_trial: true },
          test_mode: process.env.LEMON_SQUEEZY_TEST_MODE === 'true',
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: this.storeId,
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId,
            },
          },
        },
      },
    };

    try {
      const response = await this.http.post<LemonCheckoutResponse>('/checkouts', payload);
      return response.data.data.attributes.url;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error('Failed to create Lemon Squeezy checkout', {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        this.logger.error('Unexpected error creating Lemon Squeezy checkout', error);
      }
      throw new InternalServerErrorException('Failed to initialize payment checkout.');
    }
  }

  /**
   * Obtiene la URL del Customer Portal autenticado.
   */
  async getCustomerPortalUrl(lemonCustomerId: string): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('Lemon Squeezy API key is missing.');
    }

    try {
      const response = await this.http.get<LemonCustomerResponse>(`/customers/${lemonCustomerId}`);
      return response.data.data.attributes.urls.customer_portal;
    } catch (error) {
      if (isAxiosError(error)) {
        this.logger.error('Failed to retrieve customer portal from Lemon Squeezy', {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        this.logger.error('Unexpected error fetching customer portal', error);
      }
      throw new InternalServerErrorException('Billing portal could not be loaded.');
    }
  }

  async retrieveSubscription(id: string): Promise<LemonSqueezySubscriptionData> {
    return this.retrieveResource('subscriptions', id) as Promise<LemonSqueezySubscriptionData>;
  }

  async retrieveInvoice(id: string): Promise<LemonSqueezyInvoiceData> {
    return this.retrieveResource('subscription-invoices', id) as Promise<LemonSqueezyInvoiceData>;
  }

  async updateSubscriptionPlan(id: string, variantId: string, chargeImmediately: boolean): Promise<LemonSqueezySubscriptionData> {
    if (
      !this.apiKey ||
      !/^[0-9]+$/.test(id) ||
      !/^[0-9]+$/.test(variantId) ||
      !Number.isSafeInteger(Number(variantId)) ||
      Number(variantId) <= 0
    ) {
      throw new LemonPlanChangeError(true);
    }
    try {
      const response = await this.http.patch<{ data: LemonSqueezySubscriptionData }>(
        `/subscriptions/${id}`,
        {
          data: {
            type: 'subscriptions',
            id,
            attributes: {
              variant_id: Number(variantId),
              invoice_immediately: chargeImmediately,
              disable_prorations: !chargeImmediately,
            },
          },
        },
        { timeout: 10_000 },
      );
      const data = response.data.data;
      if (data?.type !== 'subscriptions' || data.id !== id) throw new Error('Provider resource mismatch.');
      this.validateResource(data);
      return data;
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      throw new LemonPlanChangeError(status !== undefined && [400, 401, 403, 404, 422].includes(status));
    }
  }

  async retrieveLatestInvoice(subscriptionId: string): Promise<LemonSqueezyInvoiceData | null> {
    if (!this.apiKey || !/^[0-9]+$/.test(subscriptionId)) throw new InternalServerErrorException('Invalid provider subscription.');
    try {
      const response = await this.http.get<{ data: LemonSqueezyInvoiceData[] }>('/subscription-invoices', {
        params: { 'filter[subscription_id]': subscriptionId, 'page[size]': 1, sort: '-createdAt' },
        timeout: 10_000,
      });
      if (!Array.isArray(response.data.data)) throw new Error('Invalid invoice list.');
      const invoice = response.data.data[0];
      if (!invoice) return null;
      if (invoice.type !== 'subscription-invoices' || !/^[0-9]+$/.test(invoice.id)) throw new Error('Invalid invoice.');
      this.validateResource(invoice);
      if (String(invoice.attributes.subscription_id) !== subscriptionId) throw new Error('Invoice subscription mismatch.');
      return invoice;
    } catch {
      throw new InternalServerErrorException('Unable to confirm provider payment.');
    }
  }

  async retrieveInvoiceForDownload(id: string): Promise<LemonSqueezyInvoiceData> {
    if (!this.apiKey)
      throw new ServiceUnavailableException({ code: 'INVOICE_PROVIDER_UNAVAILABLE', message: 'Invoice provider is unavailable.' });
    if (!/^[0-9]+$/.test(id)) throw new NotFoundException({ code: 'INVOICE_UNAVAILABLE', message: 'Invoice is unavailable.' });
    let data: LemonSqueezyWebhookPayload['data'];
    try {
      const response = await this.http.get<{ data: LemonSqueezyWebhookPayload['data'] }>(`/subscription-invoices/${id}`, {
        timeout: 10_000,
      });
      data = response.data.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404)
        throw new NotFoundException({ code: 'INVOICE_UNAVAILABLE', message: 'Invoice is unavailable.' });
      throw new ServiceUnavailableException({
        code: 'INVOICE_PROVIDER_UNAVAILABLE',
        message: 'Invoice provider is unavailable. Try again.',
      });
    }
    try {
      if (data?.type !== 'subscription-invoices' || data.id !== id) throw new Error();
      this.validateResource(data);
      return data;
    } catch {
      throw new BadGatewayException({ code: 'INVOICE_PROVIDER_INVALID', message: 'Invalid invoice response.' });
    }
  }

  private async retrieveResource(type: 'subscriptions' | 'subscription-invoices', id: string) {
    if (!this.apiKey) throw new InternalServerErrorException('Lemon Squeezy API key is missing.');
    if (!/^\d+$/.test(id)) throw new BadRequestException('Invalid provider resource ID.');
    try {
      const response = await this.http.get<{ data: LemonSqueezyWebhookPayload['data'] }>(`/${type}/${id}`);
      const data = response.data.data;
      if (data?.type !== type || data.id !== id) throw new BadRequestException('Provider resource mismatch.');
      this.validateResource(data);
      return data;
    } catch (error) {
      this.logger.error(`Unable to retrieve Lemon Squeezy ${type}/${id}.`);
      throw new InternalServerErrorException('Unable to synchronize provider billing state.');
    }
  }

  private validateResource(data: LemonSqueezyWebhookPayload['data']) {
    const attrs = data.attributes;
    if (!this.storeId || String(attrs.store_id) !== this.storeId || attrs.test_mode !== (process.env.LEMON_SQUEEZY_TEST_MODE === 'true'))
      throw new BadRequestException('Webhook store/mode mismatch.');
    for (const date of [attrs.created_at, attrs.updated_at])
      if (typeof date !== 'string' || !Number.isFinite(Date.parse(date))) throw new BadRequestException('Invalid provider date.');
    if (!Number.isSafeInteger(attrs.customer_id) || attrs.customer_id <= 0) throw new BadRequestException('Invalid customer ID.');
    if (data.type === 'subscriptions') {
      const subscription = data.attributes;
      if (
        !['active', 'on_trial', 'paused', 'past_due', 'unpaid', 'cancelled', 'expired'].includes(subscription.status) ||
        !Number.isSafeInteger(subscription.variant_id) ||
        subscription.variant_id <= 0
      )
        throw new BadRequestException('Invalid subscription attributes.');
      for (const date of [subscription.renews_at, subscription.ends_at, subscription.trial_ends_at])
        if (date !== null && (typeof date !== 'string' || !Number.isFinite(Date.parse(date))))
          throw new BadRequestException('Invalid subscription date.');
    } else if (data.type === 'subscription-invoices') {
      const invoice = data.attributes;
      if (
        invoice.urls !== undefined &&
        (invoice.urls === null ||
          typeof invoice.urls !== 'object' ||
          (invoice.urls.invoice_url !== null && !isInvoiceUrl(invoice.urls.invoice_url)))
      )
        throw new BadRequestException('Invalid invoice URL.');
      if (
        !Number.isSafeInteger(invoice.subscription_id) ||
        invoice.subscription_id <= 0 ||
        !['pending', 'paid', 'void', 'refunded', 'partial_refund'].includes(invoice.status) ||
        !/^[A-Z]{3}$/.test(invoice.currency)
      )
        throw new BadRequestException('Invalid invoice attributes.');
      for (const amount of [invoice.total, invoice.refunded_amount])
        if (!Number.isSafeInteger(amount) || amount < 0 || amount > 9_999_999_999) throw new BadRequestException('Invalid invoice amount.');
      if (invoice.refunded_amount > invoice.total) throw new BadRequestException('Invalid refund amount.');
    }
  }

  /**
   * Valida la firma HMAC-SHA256 enviada en el header x-signature de Lemon Squeezy.
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): LemonSqueezyWebhookPayload {
    if (!this.webhookSecret) {
      throw new InternalServerErrorException('Lemon Squeezy webhook secret is not set.');
    }

    if (!signature) {
      throw new BadRequestException('Missing webhook signature header.');
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (signatureBuffer.length !== digest.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      this.logger.warn('Invalid signature received for Lemon Squeezy webhook.');
      throw new BadRequestException('Invalid webhook signature.');
    }

    let payload: LemonSqueezyWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString()) as LemonSqueezyWebhookPayload;
    } catch {
      throw new BadRequestException('Invalid webhook JSON.');
    }

    const expectedTestMode = process.env.LEMON_SQUEEZY_TEST_MODE === 'true';
    if (
      !payload?.meta ||
      typeof payload.meta.event_name !== 'string' ||
      !payload.data?.attributes ||
      typeof payload.data.id !== 'string' ||
      !payload.data.id
    )
      throw new BadRequestException('Invalid webhook payload.');
    if (
      !this.storeId ||
      String(payload.data.attributes.store_id) !== this.storeId ||
      payload.meta.test_mode !== expectedTestMode ||
      payload.data.attributes.test_mode !== expectedTestMode
    )
      throw new BadRequestException('Webhook store/mode mismatch.');
    const invoiceEvent = payload.meta.event_name.startsWith('subscription_payment_');
    if (invoiceEvent && payload.data.type !== 'subscription-invoices')
      throw new BadRequestException('Invoice event requires invoice data.');
    if (!invoiceEvent && payload.meta.event_name.startsWith('subscription_') && payload.data.type !== 'subscriptions')
      throw new BadRequestException('Lifecycle event requires subscription data.');
    if (payload.data.type === 'subscriptions' || payload.data.type === 'subscription-invoices') this.validateResource(payload.data);
    return payload;
  }
}
