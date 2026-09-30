import { AppointmentCreatedVariables } from './appointment-created.type';
import { Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';

export const AppointmentCreatedEmailTemplate = ({
  customerName,
  date,
  time,
  professionalName,
  serviceName,
  cancelUrl,
  rescheduleUrl,
  detailsUrl,
  createdBy,
}: AppointmentCreatedVariables) => {
  const isCreatedByStaff = createdBy === 'STAFF';

  return (
    <Layout previewText={isCreatedByStaff ? `Nueva cita con ${professionalName}` : `Nueva cita con ${customerName}`}>
      <Section>
        <CustomHeading>{isCreatedByStaff ? `Hola ${customerName}` : `Tienes una nueva cita, ${professionalName}`}</CustomHeading>
        {isCreatedByStaff ? (
          <>
            <Text className="text-gray-600 text-lg leading-relaxed text-center mb-8">
              {professionalName} ha agendado una cita para ti por <strong>{serviceName}</strong> el <strong>{date}</strong> a las{' '}
              <strong>{time}</strong>.
            </Text>
            <Text className="text-gray-500 leading-relaxed text-center">
              Si necesitas cancelar o reprogramar tu cita, puedes hacerlo desde los siguientes enlaces.
            </Text>
          </>
        ) : (
          <>
            <Text className="text-gray-600 text-lg leading-relaxed text-center mb-8">
              El cliente <strong>{customerName}</strong> ha agendado una cita por <strong>{serviceName}</strong> para el{' '}
              <strong>{date}</strong> a las <strong>{time}</strong>.
            </Text>
            <Text className="text-gray-500 leading-relaxed text-center">Si deseas ver los detalles puedes acceder al enlace de abajo.</Text>
          </>
        )}
      </Section>
      {isCreatedByStaff ? (
        <Section className="text-center my-4 w-full">
          <Button href={cancelUrl} className="w-1/2 bg-red-600">
            Cancelar cita
          </Button>
          <Button href={rescheduleUrl} className="w-1/2 border border-gray-200 bg-transparent text-gray-700">
            Reprogramar cita
          </Button>
        </Section>
      ) : (
        <Button href={detailsUrl ?? '/appointments'}>Ver detalles</Button>
      )}
    </Layout>
  );
};

export default AppointmentCreatedEmailTemplate;
