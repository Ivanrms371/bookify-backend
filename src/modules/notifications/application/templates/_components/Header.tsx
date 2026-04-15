import { Img, Section } from '@react-email/components';

export const Header = () => {
  return (
    <Section className="mb-4">
      <Img
        src="https://res.cloudinary.com/dtlreqvwj/image/upload/v1769404881/tenant/logo/ozgapoaebvnqasyp6rgj.webp"
        alt="Turnify"
        width="80"
        className="mx-auto"
        style={{
          borderRadius: '9999px',
        }}
      />
    </Section>
  );
};
