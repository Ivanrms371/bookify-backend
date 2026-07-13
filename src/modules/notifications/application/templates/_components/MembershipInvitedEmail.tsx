import React from 'react';
import { Layout } from './Layout';
import { Heading } from '@react-email/components';
import { Button } from './Button';
import { Text } from '@react-email/components';

interface MembershipInvitedEmailProps {
  tenantName: string;
  inviteLink: string;
  role: string;
}

export const MembershipInvitedEmail = ({ tenantName, role, inviteLink }: MembershipInvitedEmailProps) => {
  return (
    <Layout previewText={`Has sido invitado a unirte a ${tenantName} en Turnify`}>
      <Heading>Has sido invitado a unirte a {tenantName}</Heading>
      
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#4b5563' }}>
        Hola,
      </Text>
      
      <Text style={{ fontSize: '16px', lineHeight: '24px', color: '#4b5563' }}>
        Te han invitado a unirte a <strong>{tenantName}</strong> como <strong>{role}</strong> en Turnify.
        Para aceptar la invitación y completar tu registro o inicio de sesión, haz clic en el siguiente botón:
      </Text>

      <Button href={inviteLink}>Aceptar Invitación</Button>

      <Text style={{ fontSize: '14px', lineHeight: '24px', color: '#6b7280', marginTop: '32px' }}>
        Si tienes problemas con el botón, copia y pega este enlace en tu navegador:{' '}
        <a href={inviteLink} style={{ color: '#2563eb' }}>
          {inviteLink}
        </a>
      </Text>
    </Layout>
  );
};

export default MembershipInvitedEmail;
