import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationConfigMap } from './notification.config.type';

export const NotificationConfig: NotificationConfigMap = {
  'customer.verification': {
    retry: { retryable: true, maxRetries: 1, backoffDelays: [10_000] },
    channels: {
      CUSTOMER: [
        { channel: NotificationChannel.WHATSAPP, billable: false },
        { channel: NotificationChannel.EMAIL, billable: false, fallbackOnly: true },
      ],
    },
  },
  'member.joined': {
    retry: { retryable: true, maxRetries: 3, backoffDelays: [60_000, 300_000, 900_000] },
    channels: { USER: [{ channel: NotificationChannel.IN_APP }] },
  },
  'billing.trial.ends.7d': {
    retry: { retryable: true, maxRetries: 3, backoffDelays: [60_000, 300_000, 900_000] },
    channels: { USER: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: false }] },
  },
  'billing.trial.ends.3d': {
    retry: { retryable: true, maxRetries: 3, backoffDelays: [60_000, 300_000, 900_000] },
    channels: { USER: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: false }] },
  },
  'billing.renewal.3d': {
    retry: { retryable: true, maxRetries: 3, backoffDelays: [60_000, 300_000, 900_000] },
    channels: { USER: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: false }] },
  },

  'professional.day-end': {
    retry: { retryable: true, maxRetries: 3, backoffDelays: [60_000, 300_000, 900_000] },
    channels: {
      PROFESSIONAL: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: true }],
    },
  },
  'professional.day-start': {
    retry: { retryable: true, maxRetries: 3, backoffDelays: [60_000, 300_000, 900_000] },
    channels: {
      PROFESSIONAL: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: true }],
    },
  },
  'appointment.created': {
    retry: {
      retryable: true,
      maxRetries: 3,
      backoffDelays: [60_000, 300_000, 900_000],
    },
    channels: {
      PROFESSIONAL: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: true }],
      USER: [{ channel: NotificationChannel.EMAIL, billable: true }],
      CUSTOMER: [
        {
          channel: NotificationChannel.WHATSAPP,
          billable: true,
          fallback: [NotificationChannel.EMAIL],
        },
        { channel: NotificationChannel.EMAIL, billable: true, fallbackOnly: true },
      ],
    },
  },

  'verification.email.created': {
    retry: {
      retryable: true,
      maxRetries: 1,
      backoffDelays: [10_000],
    },
    channels: {
      USER: [{ channel: NotificationChannel.EMAIL, billable: false }],
    },
  },

  'verification.phoneNumber.created': {
    retry: {
      retryable: true,
      maxRetries: 1,
      backoffDelays: [10_000],
    },
    channels: {
      USER: [{ channel: NotificationChannel.WHATSAPP, billable: false }],
    },
  },

  'appointment.reminder': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      CUSTOMER: [
        { channel: NotificationChannel.WHATSAPP, billable: true, fallback: [NotificationChannel.EMAIL] },
        { channel: NotificationChannel.EMAIL, billable: true, fallbackOnly: true },
      ],
    },
  },

  DEFAULT: {
    retry: {
      retryable: false,
      maxRetries: 0,
    },
    channels: {},
  },

  'appointment.cancelled': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      PROFESSIONAL: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: true }],
      USER: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: true }],
      CUSTOMER: [
        {
          channel: NotificationChannel.WHATSAPP,
          billable: true,
          fallback: [NotificationChannel.EMAIL],
        },
        { channel: NotificationChannel.EMAIL, billable: true, fallbackOnly: true },
      ],
    },
  },

  'appointment.rescheduled': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      PROFESSIONAL: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: true }],
      CUSTOMER: [
        {
          channel: NotificationChannel.WHATSAPP,
          billable: true,
          fallback: [NotificationChannel.EMAIL],
        },
        { channel: NotificationChannel.EMAIL, billable: true, fallbackOnly: true },
      ],
    },
  },

  'tenant.created': {
    retry: { retryable: true, maxRetries: 3, backoffDelays: [60_000, 300_000, 900_000] },
    channels: { USER: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL, billable: false }] },
  },

  'appointment.booked.by_professional': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      CUSTOMER: [
        {
          channel: NotificationChannel.EMAIL,
          billable: true,
          fallback: [NotificationChannel.WHATSAPP],
        },
        { channel: NotificationChannel.WHATSAPP, billable: true, fallbackOnly: true },
      ],
    },
  },

  'appointment.cancelled.by_professional': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      USER: [{ channel: NotificationChannel.EMAIL, billable: true }],
    },
  },

  'invitation.created': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      USER: [{ channel: NotificationChannel.EMAIL, billable: false }],
    },
  },
};
