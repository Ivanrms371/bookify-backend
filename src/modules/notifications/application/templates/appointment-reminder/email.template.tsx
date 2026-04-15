import { Section, Text } from '@react-email/components';
import { Layout } from '../_components/Layout';
import { CustomHeading } from '../_components/Heading';
import { Button } from '../_components/Button';
import { AppointmentReminderVariables } from './appointment-reminder.type';

export const AppointmentReminderEmailTemplate = ({
  customerName = 'Iván Rodríguez',
  date = '24 de diciembre de 2024',
  time = '10:00 AM',
  staffName = 'Juan Pérez',
  reminderType = '24h',
  cancelUrl = 'https://localhost:4000/appointments',
  rescheduleUrl = 'https://localhost:4000/appointments',
}: AppointmentReminderVariables) => {
  return (
    <Layout previewText={`Recordatorio de cita con ${staffName} ${reminderType === '24h' ? 'mañana' : 'hoy'} a las ${time}`}>
      <Section>
        <CustomHeading>Hola {customerName}</CustomHeading>
        <Section>
          <Text className="text-mist-600 text-lg leading-relaxed text-center mb-8">
            Te recordamos que tienes una cita programada con <strong>{staffName}</strong> para el <strong>{date}</strong> a las{' '}
            <strong>{time}</strong>
          </Text>
          <Text className="text-mist-500 leading-relaxed text-center">
            Si deseas cancelar o reprogramar tu cita, puedes hacerlo a través de los siguientes enlaces:
          </Text>
        </Section>
        <Section className="text-center my-4 w-full">
          <Button href={cancelUrl} className="w-1/2 bg-red-600">
            Cancelar cita
          </Button>

          <Button href={rescheduleUrl} className="w-1/2 border border-mist-200 bg-transparent text-mist-700">
            Reprogramar cita
          </Button>
        </Section>
      </Section>
    </Layout>
  );
};

export default AppointmentReminderEmailTemplate;
