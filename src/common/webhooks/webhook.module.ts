import { Module } from '@nestjs/common';
import { WebhookLoggerService } from './services/webhook-logger.service';
import { WebhookVerifierService } from './services/webhook-verifier.service';
import { WebhookLogRepository } from './repositories/webhook.repository';

@Module({
  providers: [WebhookLoggerService, WebhookVerifierService, WebhookLogRepository],
  exports: [WebhookLoggerService, WebhookVerifierService],
})
export class WebhookModule {}
