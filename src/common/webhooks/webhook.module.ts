import { Module } from '@nestjs/common';
import { WebhookLoggerService } from './services/webhook-logger.service';
import { WebhookVerifierService } from './services/webhook-verifier.service';
import { WebhookLogRepository } from './repositories/webhook.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WebhookLoggerService, WebhookVerifierService, WebhookLogRepository],
  exports: [WebhookLoggerService, WebhookVerifierService],
})
export class WebhookModule {}
