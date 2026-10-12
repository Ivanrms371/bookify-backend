import { Body, Container, Head, Html, Preview, Section, Text, Link } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { appointmentUrl } from './appointment-links';

const text: CSSProperties = { fontSize: 16, lineHeight: '26px', color: '#374151', overflowWrap: 'anywhere' };

export function AppointmentEmail({
  preview,
  heading,
  label,
  children,
  detailsUrl,
  primaryLabel = 'Ver mi cita',
  cancelUrl,
  rescheduleUrl,
}: {
  preview: string;
  heading: string;
  label: string;
  children: ReactNode;
  detailsUrl?: string;
  primaryLabel?: string;
  cancelUrl?: string;
  rescheduleUrl?: string;
}) {
  const details = appointmentUrl(detailsUrl);
  const cancel = appointmentUrl(cancelUrl);
  const reschedule = appointmentUrl(rescheduleUrl);
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: '#f9fafb', margin: 0, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <Container style={{ maxWidth: 600, width: '100%', margin: '24px auto', backgroundColor: '#ffffff' }}>
          <Section style={{ padding: '24px' }}>
            <Header />
            <Text style={{ ...text, fontSize: 13, fontWeight: 700 }}>{label}</Text>
            <Text style={{ ...text, fontSize: 26, lineHeight: '34px', fontWeight: 700 }}>{heading}</Text>
            {children}
            {details && (
              <Link
                href={details}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  backgroundColor: '#1f2937',
                  color: '#ffffff',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontSize: 16,
                  lineHeight: '24px',
                  textDecoration: 'none',
                }}
              >
                {primaryLabel}
              </Link>
            )}
            {reschedule && (
              <Text style={text}>
                <Link href={reschedule}>Reprogramar cita</Link>
              </Text>
            )}
            {cancel && (
              <Text style={text}>
                <Link href={cancel}>Cancelar cita</Link>
              </Text>
            )}
          </Section>
        </Container>
        <Footer />
      </Body>
    </Html>
  );
}

export function AppointmentDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Text style={{ ...text, margin: '8px 0' }}>
      <strong>{label}: </strong>
      {children}
    </Text>
  );
}
