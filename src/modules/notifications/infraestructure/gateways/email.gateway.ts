import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Notification, RecipientType } from 'src/generated/prisma/client';
import { UsersService } from 'src/modules/users/users.service';
import { BuildEmailResponse } from '../../domain/templates/build-email.interface';
import { CustomersService } from 'src/modules/customers/customers.service';

@Injectable()
export class EmailGateway {
  private resend: Resend;
  private readonly resendSandox: string;
  private readonly isDevelopment: boolean;
  private readonly logger = new Logger(EmailGateway.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly customersService: CustomersService,
  ) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
    this.isDevelopment = this.configService.getOrThrow<string>('NODE_ENV') === 'development';
    this.resendSandox = this.configService.getOrThrow<string>('RESEND_SANDBOX');
  }

  async send(notification: Notification, template: BuildEmailResponse) {
    const to = await this.resolveTo(notification.recipientId, notification.recipientType);

    const { react, subject } = template;

    const { data, error } = await this.resend.emails.send({
      from: 'Turnify <onboarding@resend.dev>',
      to,
      react,
      subject,
    });

    if (!data) {
      console.log(error);
      throw new Error('An error has ocurred sending email');
    }

    return data.id;
  }

  async sendDirectly(to: string, template: BuildEmailResponse) {
    const { react, subject } = template;
    // This method accepts an email address, rather than a user/customer ID.
    const resolvedTo = this.isDevelopment ? this.resendSandox : to;
    const { data } = await this.resend.emails.send({
      from: 'Turnify <onboarding@resend.dev>',
      to: resolvedTo,
      react,
      subject,
    });

    if (!data) {
      throw new Error('An error has ocurred sending email');
    }

    return data.id;
  }

  private async resolveTo(recipientId: string, recipientType: RecipientType) {
    if (this.isDevelopment) {
      return this.resendSandox;
    }

    switch (recipientType) {
      case RecipientType.CUSTOMER: {
        const customer = await this.customersService.findByIdGlobal(recipientId);
        if (!customer?.email) {
          throw new Error('Customer has no email');
        }
        return customer.email;
      }
      case RecipientType.USER: {
        const user = await this.usersService.findById(recipientId);
        if (!user.email) {
          throw new Error('User has no email');
        }
        return user.email;
      }
      default: {
        throw new Error('Invalid recipient type');
      }
    }
  }
}
