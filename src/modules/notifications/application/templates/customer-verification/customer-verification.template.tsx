import { Injectable } from '@nestjs/common';
import { Html, Body, Text, Heading } from '@react-email/components';
import type { NotificationTemplate } from '../../../domain/templates/notification-template.interface';
import type { NotificationChannel } from 'src/generated/prisma/enums';

@Injectable()
export class CustomerVerificationTemplate implements NotificationTemplate {
  readonly type = 'customer.verification';
  build(channel: NotificationChannel, variables: { code: string }) {
    if (channel === 'WHATSAPP') return { body: `Tu código de verificación es ${variables.code}. Vence en 10 minutos.` };
    if (channel === 'EMAIL')
      return {
        subject: 'Tu código de verificación',
        react: (
          <Html lang="es">
            <Body>
              <Heading>Verifica tu contacto</Heading>
              <Text>Tu código de verificación es:</Text>
              <Heading>{variables.code}</Heading>
              <Text>Vence en 10 minutos. Si no solicitaste este código, ignora este mensaje.</Text>
            </Body>
          </Html>
        ),
      };
    throw new Error('Unsupported customer verification channel');
  }
}
