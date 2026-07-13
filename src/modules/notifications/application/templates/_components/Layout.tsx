import { Head, Html, Preview, Tailwind, Body, Container } from '@react-email/components';
import { Header } from './Header';
import { Footer } from './Footer';

export const Layout = ({ children, previewText }: { children: React.ReactNode; previewText: string }) => {
  return (
    <Html>
      <Head>
        <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700&f[]=satoshi@400,700&display=swap" rel="stylesheet" />
        <style>{`
          body { font-family: 'Satoshi', Helvetica, Arial, sans-serif; }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
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
          <Container className="bg-white border border-gray-200 rounded-2xl my-8 mx-auto p-10 max-w-[500px]">
            <Header />
            {children}
          </Container>
          <Footer />
        </Body>
      </Tailwind>
    </Html>
  );
};
