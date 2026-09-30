import { NotificationChannel } from 'src/generated/prisma/enums';
import { NotificationConfigMap } from './notification.config.type';

export const NotificationConfig: NotificationConfigMap = {
  'appointment.created': {
    retry: {
      retryable: true,
      maxRetries: 3,
      backoffDelays: [60_000, 300_000, 900_000],
    },
    channels: {
      USER: [{ channel: NotificationChannel.EMAIL }],
      CUSTOMER: [
        {
          channel: NotificationChannel.WHATSAPP,
          fallback: [NotificationChannel.EMAIL],
        },
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
      USER: [{ channel: NotificationChannel.EMAIL }],
      CUSTOMER: [{ channel: NotificationChannel.EMAIL }],
    },
  },

  'verification.phoneNumber.created': {
    retry: {
      retryable: true,
      maxRetries: 1,
      backoffDelays: [10_000],
    },
    channels: {
      USER: [{ channel: NotificationChannel.WHATSAPP }],
      CUSTOMER: [{ channel: NotificationChannel.WHATSAPP }],
    },
  },

  'appointment.reminder': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      CUSTOMER: [{ channel: NotificationChannel.WHATSAPP, fallback: [NotificationChannel.EMAIL] }],
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
      USER: [{ channel: NotificationChannel.IN_APP }, { channel: NotificationChannel.EMAIL }],
      CUSTOMER: [
        {
          channel: NotificationChannel.WHATSAPP,
          fallback: [NotificationChannel.EMAIL],
        },
      ],
    },
  },

  'appointment.rescheduled': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      CUSTOMER: [
        {
          channel: NotificationChannel.WHATSAPP,
          fallback: [NotificationChannel.EMAIL],
        },
      ],
    },
  },

  'tenant.created': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      USER: [{ channel: NotificationChannel.IN_APP }],
    },
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
          fallback: [NotificationChannel.WHATSAPP],
        },
      ],
    },
  },

  'appointment.cancelled.by_professional': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      USER: [{ channel: NotificationChannel.EMAIL }],
    },
  },

  'invitation.created': {
    retry: {
      retryable: true,
      maxRetries: 3,
    },
    channels: {
      USER: [{ channel: NotificationChannel.EMAIL }],
    },
  },
};
