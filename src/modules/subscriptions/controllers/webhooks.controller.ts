import { Body, Controller, HttpCode, HttpStatus, Logger, Param, Post, Query, Headers, Res } from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import { MercadoPagoWebhookBody } from '../types/webhook.types';
import { MercadoPagoWebhookService } from '../services/mercadopago-webhook.service';
import { WebhookVerifierService } from 'src/common/webhooks/services/webhook-verifier.service';
import { Response } from 'express';
import { WebhookLoggerService } from 'src/common/webhooks/services/webhook-logger.service';
import { WebhookStatus } from 'src/generated/prisma/enums';

@Controller('webhooks/mercadopago')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  constructor(
    private readonly webhookLogService: WebhookLoggerService,
    private readonly webhookVerifierService: WebhookVerifierService,
    private readonly mercadoPagoWebhookService: MercadoPagoWebhookService,
  ) {}

  /**
   * POST /api/webhooks/mercadopago
   * Handle a webhook from MercadoPago
   */
  @Post()
  async handleWebhook(
    @Body() body: MercadoPagoWebhookBody,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Res() res: Response,
  ) {
    // 1. Filter only subscriptions
    const allowedTypes = ['subscription_preapproval', 'subscription_authorized_payment'];
    if (!allowedTypes.includes(body.type)) {
      return res.status(HttpStatus.OK);
    }

    // 3. Register init proccess
    const logId = await this.webhookLogService.logWebhook({
      requestId,
      provider: 'mercadopago',
      type: body.type,
      status: WebhookStatus.PROCESSING,
      receivedAt: new Date(),
      resourceId: body.data.id,
    });

    if (!logId) {
      return res.status(HttpStatus.OK);
    }

    try {
      // 4. Process webhook (request API and update subscription)
      await this.mercadoPagoWebhookService.processWebhook(body);

      // 5. Mark as completed
      await this.webhookLogService.markAsProcessed(logId);

      return res.status(HttpStatus.OK);
    } catch (error) {
      await this.webhookLogService.markAsError(logId, error.message);
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * POST /api/webhooks/mercadopago/test
   * Test a webhook from MercadoPago
   */

  @Post('test')
  async testWebhook(@Body() body: any) {
    this.logger.log('Test webhook called');
    await this.mercadoPagoWebhookService.processWebhook(body);
    return { received: true };
  }
}
