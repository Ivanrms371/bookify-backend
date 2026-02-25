import { VerificationType } from 'src/generated/prisma/enums';

export type VerificationCreatedEvent = {
  email: string;
  name: string;
  confirmLink: string;
};
