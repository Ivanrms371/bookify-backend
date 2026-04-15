import { Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';
import { AppointmentBookedByStaffVariables } from './appointment-booked-by-staff.type';

export const AppointmentBookedByStaffEmail = ({
  customerName = 'Iván Rodríguez',
  date = '24 de diciembre de 2024',
  time = '10:00 AM',
  staffName = 'Juan Pérez',
  serviceName = 'Corte de pelo',
}: AppointmentBookedByStaffVariables) => {
  return (
    <Layout previewText={`Cita reservada con ${customerName}`}>
      <Section>
        <CustomHeading>Hola {customerName}</CustomHeading>
        <Text className="text-mist-600 text-lg leading-relaxed text-center mb-8">
          <strong>{staffName}</strong> te ha reservado una cita para el <strong>{date}</strong> a las <strong>{time}</strong> para el
          servicio <strong>{serviceName}</strong>
        </Text>
        <Text className="text-mist-500 leading-relaxed text-center">Si deseas ver los detalles puedes acceder al enlace de abajo.</Text>
      </Section>
      <Button href="https://localhost:4000/appointments">Ver detalles</Button>
    </Layout>
  );
};

export default AppointmentBookedByStaffEmail;
