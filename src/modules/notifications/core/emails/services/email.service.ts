import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload, NotificationResult } from '../../../types/notification.type';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { TemplateResolver } from '../../resolvers/template.resolver';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly templateResolver: TemplateResolver,
  ) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const { contact, content } = payload;

    if (!contact.email) {
      this.logger.error('Email is required for email notifications');
      return {
        provider: 'resend',
        error: 'Email is required for email notifications',
      };
    }

    const { component, subject } = await this.templateResolver.resolve(
      payload.type,
      payload.content.variables,
    );

    try {
      const { data } = await this.resend.emails.send({
        from: 'Turnify <onboarding@resend.dev>',
        to: contact.email,
        react: component,
        subject: subject,
      });
      return {
        provider: 'resend',
        providerMessageId: data?.id,
      };
    } catch (error) {
      this.logger.error('Error sending email', error);
      return {
        provider: 'resend',
        error: error,
      };
    }
  }
}
