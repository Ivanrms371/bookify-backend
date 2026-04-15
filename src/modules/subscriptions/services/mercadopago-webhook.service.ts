import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoService } from 'src/shared/integrations/mercadopago/mercadopago.service';
import { SubscriptionService } from './subscription.service';
import { MercadoPagoPreapproval } from 'src/shared/integrations/mercadopago/types/preapproval-subscription.type';
import { MercadoPagoWebhookBody } from '../types/webhook.types';

@Injectable()
export class MercadoPagoWebhookService {
  private readonly logger = new Logger(MercadoPagoWebhookService.name);
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async processWebhook(body: MercadoPagoWebhookBody) {
    // 1. Call mercadopago GET /v1/preapprovar/{id}
    const data = await this.mercadoPagoService.findPreapprovalSubscriptionById(body.data.id);
    // 2. Update subscription
    await this.handleSubscriptionStatus(data);
  }

  private async handleSubscriptionStatus(mpData: MercadoPagoPreapproval) {
    await this.subscriptionService.syncSubscriptionState(mpData);
  }
}
