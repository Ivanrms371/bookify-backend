import { ProviderSyncRepository } from './repositories/provider-sync.repository';
import { Module } from '@nestjs/common';
import { WebhookLoggerService } from './services/webhook-logger.service';
import { WebhookLogRepository } from './repositories/webhook.repository';

@Module({
  providers: [ProviderSyncRepository, WebhookLoggerService, WebhookLogRepository],
  exports: [ProviderSyncRepository, WebhookLoggerService],
})
export class WebhookModule {}
