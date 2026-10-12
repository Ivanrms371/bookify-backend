import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryRejectedError } from '../../errors/delivery-rejected.error';
import type { ResendAcceptance } from '../../types/notification-reconciliation.type';
import type { GetEmailResponseSuccess } from 'resend';
import { Resend } from 'resend';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';

@Injectable()
export class EmailGateway {
  private resend: Resend;
  private readonly resendSandox: string;
  private readonly isDevelopment: boolean;
  private readonly logger = new Logger(EmailGateway.name);

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
    this.isDevelopment = this.configService.getOrThrow<string>('NODE_ENV') === 'development';
    this.resendSandox = this.configService.getOrThrow<string>('RESEND_SANDBOX');
  }

  async getAcceptance(providerId: string): Promise<ResendAcceptance | null> {
    // emails.get has no request options in the installed SDK. Its public GET
    // helper preserves auth headers and forwards the abort signal to fetch.
    const options = { headers: {}, signal: AbortSignal.timeout(10_000) };
    const { data, error } = await this.resend.get<GetEmailResponseSuccess>(`/emails/${encodeURIComponent(providerId)}`, options);
    if (error || !data || data.id !== providerId) return null;
    const acceptedAt = new Date(data.created_at);
    return { id: data.id, ...(Number.isFinite(acceptedAt.getTime()) ? { acceptedAt } : {}) };
  }

  async send(to: string, template: BuildEmailResponse, deliveryId?: string) {
    const { react, subject } = template;
    const resolvedTo = this.isDevelopment ? this.resendSandox : to;

    const { data, error } = await this.resend.emails.send({
      from: 'Turnify <onboarding@resend.dev>',
      to: resolvedTo,
      react,
      subject,
    }, deliveryId ? { idempotencyKey: `notification-delivery/${deliveryId}` } : undefined);

    if (!data?.id) {
      this.logger.error('Email delivery failed', error);
      // Only explicit client rejections establish that the provider did not accept mail.
      // A concurrent idempotent request (409) may still be accepted by the provider.
      if (error?.statusCode && error.statusCode >= 400 && error.statusCode < 500 && ![408, 409].includes(error.statusCode)) {
        throw new DeliveryRejectedError('Provider rejected sending email');
      }
      throw new Error('Ambiguous result sending email');
    }

    return data.id;
  }
}
