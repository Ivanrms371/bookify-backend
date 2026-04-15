import { Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';
import { AppointmentCancelledByStaffVariables } from './appointment-cancelled-by-staff.type';

export const AppointmentCancelledByStaffEmailTemplate = ({
  customerName = 'Iván Rodríguez',
  date = '24 de diciembre de 2024',
  time = '10:00 AM',
  staffName = 'Juan Pérez',
  reason,
}: AppointmentCancelledByStaffVariables) => {
  return (
    <Layout previewText={`Cita cancelada con ${staffName}`}>
      <Section>
        <CustomHeading>Hola, {customerName}</CustomHeading>
        <Text className="text-mist-600 text-lg leading-relaxed text-center mb-8">
          <strong>{staffName}</strong> ha cancelado la cita para el <strong>{date}</strong> a las <strong>{time}</strong>
        </Text>
        {reason && <Text className="text-mist-500 leading-relaxed text-center">Motivo: {reason}</Text>}
      </Section>
      <Button href="https://localhost:4000/appointments">Ver detalles</Button>
    </Layout>
  );
};

export default AppointmentCancelledByStaffEmailTemplate;
