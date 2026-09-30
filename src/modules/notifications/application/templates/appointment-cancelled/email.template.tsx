import { AppointmentCancelledVariables } from './appointment-cancelled.type';
import { Section, Text } from '@react-email/components';
import { CustomHeading } from '../_components/Heading';
import { Layout } from '../_components/Layout';
import { Button } from '../_components/Button';
import { RecipientType } from 'src/generated/prisma/enums';

export const AppointmentCancelledEmailTemplate = ({
  customerName = 'Iván Rodríguez',
  date = '24 de diciembre de 2024',
  time = '10:00 AM',
  professionalName = 'Juan Pérez',
  cancelledBy = RecipientType.CUSTOMER,
  cancelledByName,
  cancellationReason,
}: AppointmentCancelledVariables) => {
  const cancelledByCustomer = cancelledBy === RecipientType.CUSTOMER;
  const recipientName = cancelledByCustomer ? professionalName : customerName;
  const actorName = cancelledByName ?? (cancelledByCustomer ? customerName : professionalName);

  return (
    <Layout previewText={`Cita cancelada con ${cancelledByCustomer ? customerName : professionalName}`}>
      <Section>
        <CustomHeading>Cita cancelada, {recipientName}</CustomHeading>
        <Text className="text-gray-600 text-lg leading-relaxed text-center mb-8">
          {cancelledByCustomer ? (
            <>
              El cliente <strong>{customerName}</strong> ha cancelado la cita para el <strong>{date}</strong> a las <strong>{time}</strong>
            </>
          ) : (
            <>
              <strong>{actorName}</strong> ha cancelado tu cita con <strong>{professionalName}</strong> para el <strong>{date}</strong> a
              las <strong>{time}</strong>
            </>
          )}
        </Text>
        {cancellationReason ? (
          <Text className="text-gray-600 leading-relaxed text-center">
            Motivo: <strong>{cancellationReason}</strong>
          </Text>
        ) : null}
        <Text className="text-gray-500 leading-relaxed text-center">Si deseas ver los detalles puedes acceder al enlace de abajo.</Text>
      </Section>
      <Button href="https://localhost:4000/appointments">Ver detalles</Button>
    </Layout>
  );
};

export default AppointmentCancelledEmailTemplate;
