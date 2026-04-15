import { Injectable, Logger } from '@nestjs/common';
import { WebhookLogRepository } from '../repositories/webhook.repository';
import { WebhookLogCreateInput, WebhookLogUpsertArgs } from 'src/generated/prisma/models';
import { WebhookStatus } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class WebhookLoggerService {
  private readonly logger = new Logger(WebhookLoggerService.name);
  constructor(private readonly webhookLogRepository: WebhookLogRepository) {}

  async logWebhook(data: WebhookLogCreateInput) {
    try {
      const action = await this.getProcessingAction(data.provider, data.requestId);
      if (action === 'SKIP') {
        return null;
      }

      const log = await this.webhookLogRepository.upsert({
        where: {
          requestId: data.requestId,
        },
        create: data,
        update: {
          receivedAt: new Date(),
        },
      });

      this.logger.log(`Webhook logged: ${log.id} | ${data.type} | ${data.requestId}`);

      return log.id;
    } catch (error) {
      this.logger.error(`Error creating webhook log ${error.message}`, error.stack);
      return null;
    }
  }

  private async getProcessingAction(provider: string, requestId: string) {
    const existing = await this.findByRequestId(provider, requestId);

    if (!existing) return 'PROCESS';

    if (existing.status === WebhookStatus.PROCESSED) {
      this.logger.log(`♻️ Already processed: ${requestId}`);
      return 'SKIP';
    }

    if (existing.status === WebhookStatus.PENDING || existing.status === WebhookStatus.PROCESSING) {
      const minutesSinceUpdate = (new Date().getTime() - existing.updatedAt.getTime()) / 60000;

      if (minutesSinceUpdate < 5) {
        this.logger.warn(`⏳ Waiting: Request ${requestId} is being handled (locked for ${minutesSinceUpdate.toFixed(1)}m).`);
        return 'SKIP';
      }

      this.logger.warn(`🧟 Zombie detected: Request ${requestId} was stuck in ${existing.status} for >5m. Retrying.`);
      return 'PROCESS';
    }

    if (existing.status === WebhookStatus.FAILED) {
      this.logger.log(`🛑 Skipping: Request ${requestId} failed definitively.`);
      return 'SKIP';
    }

    // ERROR: Fallo de sistema (ej. base de datos caída) -> DALE DE NUEVO
    if (existing.status === WebhookStatus.ERROR) {
      this.logger.log(`🔄 Retrying: Request ${requestId} had a system error.`);
      return 'PROCESS';
    }

    return 'SKIP';
  }

  async isProcessed(provider: string, requestId: string) {
    try {
      const log = await this.webhookLogRepository.findFirst({
        where: {
          provider,
          requestId,
          status: {
            in: [WebhookStatus.PROCESSED, WebhookStatus.FAILED],
          },
        },
      });

      if (log) {
        this.logger.log(`♻️ Webhook already processed: ${provider} | ${requestId} | ${log.status} | ${log.processedAt?.toISOString()}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking if webhook is processed ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByRequestId(provider: string, requestId: string) {
    try {
      return await this.webhookLogRepository.findFirst({
        where: {
          provider,
          requestId,
        },
        select: {
          id: true,
          provider: true,
          requestId: true,
          type: true,
          status: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.logger.error(`Error finding webhook log: ${error.message}`, error.stack);
      return null;
    }
  }

  async markAsProcessed(logId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await this.webhookLogRepository.update({
        where: { id: logId },
        data: {
          status: WebhookStatus.PROCESSED,
          processedAt: new Date(),
          ...(metadata && {
            metadata: metadata as Prisma.JsonObject,
          }),
        },
      });

      this.logger.log(`✅ Webhook processed successfully: ${logId}`);
    } catch (error) {
      this.logger.error(`Error marking webhook as processed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async markAsFailed(logId: string, error: Error): Promise<void> {
    try {
      await this.webhookLogRepository.update({
        where: { id: logId },
        data: {
          status: WebhookStatus.FAILED,
          error: error.message,
          processedAt: new Date(),
        },
      });

      this.logger.warn(`⚠️ Webhook failed (tenant error): ${logId} | ${error.message}`);
    } catch (error) {
      this.logger.error(`Error marking webhook as failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark webhook as infraestructure error
   *
   * Use when the error is recoverable (ej: db down, timeout)
   * In that cases we want to retry the webhook later
   *
   * @param logId
   * @param error
   *
   */
  async markAsError(logId: string, error: Error) {
    try {
      await this.webhookLogRepository.update({
        where: { id: logId },
        data: {
          status: WebhookStatus.ERROR,
          error: error.message,
          processedAt: new Date(),
        },
      });

      this.logger.error(`🔴 Webhook error (infrastructure): ${logId} | ${error.message}`);
    } catch (error) {
      this.logger.error(`Error marking webhook as error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cleanup(daysOld: number = 30, onlyProcessed: boolean = true): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const where: Prisma.WebhookLogWhereInput = {
      receivedAt: {
        lt: cutoffDate,
      },
    };

    if (onlyProcessed) {
      where.status = 'PROCESSED';
    }

    const result = await this.webhookLogRepository.deleteMany({ where });

    this.logger.log(`🧹 Cleaned up ${result.count} webhook logs older than ${daysOld} days`);

    return result.count;
  }
}
