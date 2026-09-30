import { AppointmentRescheduledVariables } from './appointment-reschedule.type';
import { Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';

export const AppointmentRescheduleEmailTemplate = ({
  customerName = 'Iván Rodríguez',
  date = '24 de diciembre de 2024',
  time = '10:00 AM',
  serviceName = 'Corte de cabello',
  professionalName = 'Juan Pérez',
  previousDate,
  previousTime,
  rescheduleReason,
  rescheduledByName,
}: AppointmentRescheduledVariables) => {
  return (
    <Layout previewText={`Cita reprogramada con ${professionalName}`}>
      <Section>
        <CustomHeading>Cita reprogramada, {customerName}</CustomHeading>
        <Text className="text-gray-600 text-lg leading-relaxed text-center mb-8">
          Tu cita de <strong>{serviceName}</strong> con <strong>{professionalName}</strong> fue reprogramada para el{' '}
          <strong>{date}</strong> a las <strong>{time}</strong>
        </Text>
        {previousDate && previousTime ? (
          <Text className="text-gray-600 leading-relaxed text-center">
            Horario anterior: <strong>{previousDate}</strong> a las <strong>{previousTime}</strong>
          </Text>
        ) : null}
        {rescheduledByName ? (
          <Text className="text-gray-600 leading-relaxed text-center">
            Reprogramada por: <strong>{rescheduledByName}</strong>
          </Text>
        ) : null}
        {rescheduleReason ? (
          <Text className="text-gray-600 leading-relaxed text-center">
            Motivo: <strong>{rescheduleReason}</strong>
          </Text>
        ) : null}
        <Text className="text-gray-500 leading-relaxed text-center">Si deseas ver los detalles puedes acceder al enlace de abajo.</Text>
      </Section>
      <Button href="https://localhost:4000/appointments">Ver detalles</Button>
    </Layout>
  );
};

export default AppointmentRescheduleEmailTemplate;
