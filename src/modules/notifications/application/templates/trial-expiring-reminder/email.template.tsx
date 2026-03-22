import { Hr, Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';
import { TrialExpiringReminderVariables } from './trial-expiring-reminder.type';

export const TrialExpiringReminderEmailTemplate = ({
  name = 'Iván Rodríguez',
  daysLeft = 3,
  planName = 'Plan Pro',
  connectPaymentUrl = 'https://localhost:4000/dashboard',
}: TrialExpiringReminderVariables) => {
  return (
    <Layout previewText={`Tu prueba gratuita está por expirar`}>
      <Section>
        <CustomHeading>Tu prueba gratuita está por expirar</CustomHeading>
        <Text className="text-mist-600 text-lg leading-relaxed text-center mb-8">
          Hola <strong>{name}</strong>, esperemos estes disfrutando nuestra aplicación. Tu prueba gratuita de <strong>{planName}</strong>{' '}
          está por expirar en <strong>{daysLeft} días</strong>. Por favor, conecta tu cuenta de Mercado Pago para continuar disfrutando de
          todos los beneficios de Turnify.
        </Text>
      </Section>
      <Button href={connectPaymentUrl} className="bg-sky-500">
        Conectar Mercado Pago
      </Button>
      <Hr className="my-4" />
      <Text className="text-mist-500 text-sm leading-relaxed text-center">
        Si no creaste esta cuenta, por favor ignora este correo electrónico.
      </Text>
    </Layout>
  );
};

export default TrialExpiringReminderEmailTemplate;
