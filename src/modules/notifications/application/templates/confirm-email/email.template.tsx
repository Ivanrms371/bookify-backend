import { Hr, Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';
import { ConfirmEmailVariables } from './confirm-email.type';

export const VerificationEmailEmailTemplate = ({ confirmLink, name = 'Iván Rodríguez' }: ConfirmEmailVariables) => {
  return (
    <Layout previewText={`Confirma tu correo electrónico en Turnify`}>
      <Section>
        <CustomHeading>Confirma tu correo electrónico</CustomHeading>
        <Text className="text-mist-600 text-lg leading-relaxed text-center mb-8">
          Hola <strong>{name}</strong>, gracias por registrarte en Turnify. Por favor, confirma tu correo electrónico haciendo clic en el
          botón de abajo.
        </Text>
      </Section>
      <Button href={confirmLink}>Confirmar cuenta</Button>
      <Hr className="my-4" />
      <Text className="text-mist-500 text-sm leading-relaxed text-center">
        Si no creaste esta cuenta, por favor ignora este correo electrónico.
      </Text>
    </Layout>
  );
};

export default VerificationEmailEmailTemplate;
