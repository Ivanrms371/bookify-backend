import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig } from './mercadopago.config';
import axios from 'axios';
import { MercadoPagoCreatePlanRequest, MercadoPagoCreatePlanResponse } from './types/mp-plan.types';
import { MercadoPagoCreateSubscriptionRequest, MercadoPagoSubscriptionResponse } from './types/create-subscription.type';
import { MercadoPagoPreapproval } from './types/preapproval-subscription.type';
import { MercadoPagoPaymentSearchResponse } from './types/payment.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MercadoPagoService {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    this.accessToken = this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN')!;
    this.baseUrl = this.config.get<string>('MERCADOPAGO_BASE_URL')!;

    this.headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * PLANS
   * Endpoint: /v1/preapproval_plan
   */
  async createSubscriptionPlan(plan: MercadoPagoCreatePlanRequest): Promise<MercadoPagoCreatePlanResponse> {
    const url = `${this.baseUrl}/v1/preapproval_plan`;
    const response = await axios.post(url, plan, { headers: this.headers });
    return response.data;
  }

  /**
   * SUBSCRIPTIONS relation between user and plan
   * Endpoint: /v1/preapproval
   */
  async createSubscription(subscription: MercadoPagoCreateSubscriptionRequest): Promise<MercadoPagoSubscriptionResponse> {
    const url = `${this.baseUrl}/v1/preapproval`;
    const response = await axios.post(url, subscription, {
      headers: this.headers,
    });
    return response.data as MercadoPagoSubscriptionResponse;
  }

  /**
   * Find subscription by id (Used by webhook)
   * Endpoint: /v1/preapproval/{id}
   */
  async findPreapprovalSubscriptionById(id: string) {
    const url = `${this.baseUrl}/v1/preapproval/${id}`;
    const response = await axios.get<MercadoPagoPreapproval>(url, {
      headers: this.headers,
    });
    return response.data;
  }

  /**
   * Find payment by external reference (Used by webhook or specifics payments)
   * Endpoint: /v1/payments/search
   */
  async findPaymentByExternalReference(externalReference: string) {
    const url = `${this.baseUrl}/v1/payments/search`;
    const response = await axios.get<MercadoPagoPaymentSearchResponse>(url, {
      headers: this.headers,
      params: {
        external_reference: externalReference,
      },
    });
    return response.data;
  }

  /**
   * Cancel or pause
   * Endpoint: /v1/preapproval/{id}
   */
  async updateSubscriptionStatus(id: string, status: 'cancelled' | 'paused' | 'authorized') {
    const url = `${this.baseUrl}/v1/preapproval/${id}`;
    const response = await axios.put(url, { status }, { headers: this.headers });
    return response.data;
  }
}
