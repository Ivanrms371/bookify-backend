import { Link } from '@react-email/components';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

export const Button = ({ children, href, className }: ButtonProps) => {
  return (
    <Link
      href={href}
      className={twMerge(
        'my-2 bg-mist-800 rounded-full text-white text-center font-bold py-4 no-underline text-lg inline-block w-full',
        className,
      )}
    >
      {children}
    </Link>
  );
};
