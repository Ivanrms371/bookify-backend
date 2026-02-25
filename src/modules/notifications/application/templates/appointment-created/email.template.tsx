import { AppointmentCreatedVariables } from './appointment-created.type';
import { Link, Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';

export const AppointmentCreatedEmailTemplate = ({
  customerName = 'Iván Rodríguez',
  date = '24 de diciembre de 2024',
  time = '10:00 AM',
  staffName = 'Juan Pérez',
}: AppointmentCreatedVariables) => {
  return (
    <Layout previewText={`Nueva cita con ${customerName}`}>
      <Section>
        <CustomHeading>Tienes una nueva cita, {staffName}</CustomHeading>
        <Text className="text-gray-600 text-lg leading-relaxed text-center mb-8">
          El cliente <strong>{customerName}</strong> ha agendado una cita para el <strong>{date}</strong> a las <strong>{time}</strong>
        </Text>
        <Text className="text-gray-500 leading-relaxed text-center">Si deseas ver los detalles puedes acceder al enlace de abajo.</Text>
      </Section>
      <Button href="https://localhost:4000/appointments">Ver detalles</Button>
    </Layout>
  );
};

export default AppointmentCreatedEmailTemplate;
