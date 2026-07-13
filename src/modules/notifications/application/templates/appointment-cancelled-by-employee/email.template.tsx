import { Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';
import { AppointmentCancelledByEmployeeVariables } from './appointment-cancelled-by-employee.type';

export const AppointmentCancelledByEmployeeEmailTemplate = ({
  customerName = 'Iván Rodríguez',
  date = '24 de diciembre de 2024',
  time = '10:00 AM',
  employeeName = 'Juan Pérez',
  reason,
}: AppointmentCancelledByEmployeeVariables) => {
  return (
    <Layout previewText={`Cita cancelada con ${employeeName}`}>
      <Section>
        <CustomHeading>Hola, {customerName}</CustomHeading>
        <Text className="text-gray-600 text-lg leading-relaxed text-center mb-8">
          <strong>{employeeName}</strong> ha cancelado la cita para el <strong>{date}</strong> a las <strong>{time}</strong>
        </Text>
        {reason && <Text className="text-gray-500 leading-relaxed text-center">Motivo: {reason}</Text>}
      </Section>
      <Button href="https://localhost:4000/appointments">Ver detalles</Button>
    </Layout>
  );
};

export default AppointmentCancelledByEmployeeEmailTemplate;
