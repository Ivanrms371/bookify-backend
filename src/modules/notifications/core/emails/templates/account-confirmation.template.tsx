import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Img,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  name: string;
  confirmLink: string;
}

export const AccountConfirmationTemplate = ({
  name = 'Iván Rodríguez',
  confirmLink = 'https://localhost:4000/confirm/',
}: Props) => {
  return (
    <Html>
      <Head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700&f[]=satoshi@400,700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body { font-family: 'Satoshi', Helvetica, Arial, sans-serif; }
        `}</style>
      </Head>
      <Preview>Bienvenido a Turnify - Confirma tu acceso</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: {
                sans: ['Satoshi', 'Helvetica', 'Arial', 'sans-serif'],
                cabinet: ['Cabinet Grotesk', 'sans-serif'],
              },
            },
          },
        }}
      >
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-gray-200 rounded-xl my-10 mx-auto p-10 max-w-[500px]">
            {/* Logo */}
            <Section className="mb-4">
              <Img
                src="https://res.cloudinary.com/dtlreqvwj/image/upload/v1769404881/business/logo/ozgapoaebvnqasyp6rgj.webp"
                alt="Turnify"
                width="40"
                className="mx-auto"
                style={{
                  borderRadius: '9999px',
                }}
              />
            </Section>

            {/* Contenido Principal */}
            <Section>
              <Heading className="text-gray-700 text-3xl font-normal text-center p-0 mb-4 tracking-tight font-cabinet">
                ¡Hola <span className="font-bold text-gray-900">{name}</span>!
              </Heading>
              <Text className="text-gray-600 text-lg leading-relaxed text-center mb-8">
                Estamos emocionados de tenerte a bordo. Para empezar a gestionar tus turnos, solo
                necesitamos confirmar tu dirección de correo electrónico.
              </Text>
            </Section>

            {/* CTA */}
            <Section className="text-center mb-8">
              <Link
                href={confirmLink}
                style={{
                  backgroundColor: '#111827',
                  borderRadius: '9999px',
                  color: '#ffffff',
                  display: 'inline-block',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  lineHeight: '1',
                  padding: '16px 32px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  msoPaddingAlt: '0px',
                  border: '1px solid #111827',
                }}
              >
                Confirmar mi cuenta
              </Link>
            </Section>

            <Hr className="border-gray-200 my-8" />

            {/* Seguridad/Ayuda */}
            <Section>
              <Text className="text-gray-500 leading-relaxed">
                <strong>¿No solicitaste esto?</strong> Si no creaste una cuenta en Turnify, puedes
                ignorar este correo de forma segura o contactarnos si tienes dudas.
              </Text>
            </Section>
          </Container>

          <Section className="mx-auto max-w-[500px] text-center mb-10">
            <Text className="text-gray-600 text-xs uppercase tracking-widest">
              © 2026 Turnify Inc.
            </Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AccountConfirmationTemplate;
