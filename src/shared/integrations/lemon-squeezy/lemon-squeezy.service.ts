// src/shared/integrations/lemon-squeezy/lemon-squeezy.service.ts

import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { CreateCheckoutParams, LemonCheckoutResponse, LemonCustomerResponse } from './types/lemon-squeezy.types';
import axios, { AxiosInstance, isAxiosError } from 'axios';
import { LemonSqueezyWebhookPayload } from './types/lemon-squeezy-webhook.types';

@Injectable()
export class LemonSqueezyService {
  private readonly logger = new Logger(LemonSqueezyService.name);
  private readonly http: AxiosInstance;

  private readonly apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  private readonly storeId = process.env.LEMON_SQUEEZY_STORE_ID;
  private readonly webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

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

    const { variantId, userEmail, userName, tenantId, redirectUrl, trialEndsAt } = params;

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
          product_options: redirectUrl ? { redirect_url: redirectUrl } : undefined,
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
      console.log(response.data.data.attributes);
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

    return JSON.parse(rawBody.toString()) as LemonSqueezyWebhookPayload;
  }
}
