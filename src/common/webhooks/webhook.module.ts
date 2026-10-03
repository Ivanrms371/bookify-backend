import { ProviderSyncRepository } from './repositories/provider-sync.repository';
import { Module } from '@nestjs/common';
import { WebhookLoggerService } from './services/webhook-logger.service';
import { WebhookVerifierService } from './services/webhook-verifier.service';
import { WebhookLogRepository } from './repositories/webhook.repository';

@Module({
  providers: [ProviderSyncRepository, WebhookLoggerService, WebhookVerifierService, WebhookLogRepository],
  exports: [ProviderSyncRepository, WebhookLoggerService, WebhookVerifierService],
})
export class WebhookModule {}
