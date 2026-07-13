import { Heading } from '@react-email/components';

export const CustomHeading = ({ children }: { children: React.ReactNode }) => {
  return <Heading className="text-gray-700 text-3xl font-normal text-center p-0 mb-4 tracking-tight font-cabinet">{children}</Heading>;
};
