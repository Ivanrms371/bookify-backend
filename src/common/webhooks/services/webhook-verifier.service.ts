import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookVerifierService {
  private readonly logger = new Logger(WebhookVerifierService.name);
  constructor(private readonly configService: ConfigService) {}

  /**
   * Verify signature of Mercado Pago webhook
   *
   * Mercado Pago send signature in the header x-signature
   * Format: "ts=1234567890,v1=abc123def456..."
   *
   * @param payload - Body of the webhook
   * @param signature - Header x-signature
   * @returns true if the signature is valid
   *
   * @example
   * const isValid = this.webhookVerifier.verifyMercadoPago(body, headers['x-signature']);
   * if (!isValid) {
   *   throw new UnauthorizedException('Invalid signature');
   * }
   *
   * @see https://www.mercadopago.com/developers/es/docs/your-integrations/notifications/webhooks#editor_6
   */
  verifyMercadoPago(payload: any, signature: string): boolean {
    try {
      if (!signature) {
        this.logger.warn('Missing signature for Mercado Pago webhook');
        return false;
      }

      // parse signature: "ts=1234567890,v1=abc123def456..."
      const parts = signature.split(',');
      const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
      const hash = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

      if (!ts || !hash) {
        this.logger.warn('Invalid signature format for Mercado Pago webhook');
        return false;
      }

      // build string to signature:
      const dataId = payload.data.id || '';
      const requestId = payload.id || '';
      const dataToSign = `id:${dataId};request-id:${requestId};ts:${ts};`;

      // calculate HMAC-SHA256
      const secret = this.configService.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
      if (!secret) {
        this.logger.error('MERCADOPAGO_WEBHOOK_SECRET not configured');
        return false;
      }

      const hmac = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

      const isValid = hmac === hash;
      if (isValid) {
        this.logger.debug('✅ Mercado Pago signature verified');
      } else {
        this.logger.warn('❌ Invalid Mercado Pago signature');
        this.logger.debug(`Expected: ${hmac}`);
        this.logger.debug(`Received: ${hash}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Error verifying Mercado Pago webhook signature: ${error.message}`, error.stack);
      return false;
    }
  }
}
