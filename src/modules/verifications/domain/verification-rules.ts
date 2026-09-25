import { NotificationChannel, VerificationType } from 'src/generated/prisma/enums';

const MINUTE_MS = 60_000;

export const OTP_CODE_LENGTH = 6;
export const MAGIC_LINK_TOKEN_BYTES = 32;
export const VERIFICATION_MAX_ATTEMPTS = 3;

/** Email / password-reset magic links. Allowed range: 30–60 minutes. */
export const MAGIC_LINK_TTL_MS = 30 * MINUTE_MS;

/** Phone OTP (6 digits). Allowed range: 5–10 minutes. */
export const OTP_TTL_MS = 10 * MINUTE_MS;

export type VerificationChallengeKind = 'MAGIC_LINK' | 'OTP';

const CHALLENGE_KIND_BY_TYPE: Record<VerificationType, VerificationChallengeKind> = {
  CUSTOMER_EMAIL_VERIFICATION: 'MAGIC_LINK',
  USER_EMAIL_VERIFICATION: 'MAGIC_LINK',
  PASSWORD_RESET: 'MAGIC_LINK',
  CUSTOMER_PHONE_VERIFICATION: 'OTP',
  USER_PHONE_VERIFICATION: 'OTP',
};

// Mapeo exhaustivo de tipo a canal de transporte
const CHANNEL_BY_TYPE: Record<VerificationType, NotificationChannel> = {
  CUSTOMER_EMAIL_VERIFICATION: NotificationChannel.EMAIL,
  USER_EMAIL_VERIFICATION: NotificationChannel.EMAIL,
  PASSWORD_RESET: NotificationChannel.EMAIL,
  CUSTOMER_PHONE_VERIFICATION: NotificationChannel.WHATSAPP,
  USER_PHONE_VERIFICATION: NotificationChannel.WHATSAPP,
};

const TTL_BY_CHALLENGE_KIND: Record<VerificationChallengeKind, number> = {
  MAGIC_LINK: MAGIC_LINK_TTL_MS,
  OTP: OTP_TTL_MS,
};

export function getVerificationChallengeKind(type: VerificationType): VerificationChallengeKind {
  return CHALLENGE_KIND_BY_TYPE[type];
}

export function getVerificationChannel(type: VerificationType): NotificationChannel {
  return CHANNEL_BY_TYPE[type];
}

export function getVerificationTtlMs(type: VerificationType): number {
  return TTL_BY_CHALLENGE_KIND[getVerificationChallengeKind(type)];
}

export function getVerificationExpiresAt(type: VerificationType, now: Date = new Date()): Date {
  return new Date(now.getTime() + getVerificationTtlMs(type));
}

export function isOtpVerification(type: VerificationType): boolean {
  return getVerificationChallengeKind(type) === 'OTP';
}

export function isMagicLinkVerification(type: VerificationType): boolean {
  return getVerificationChallengeKind(type) === 'MAGIC_LINK';
}
