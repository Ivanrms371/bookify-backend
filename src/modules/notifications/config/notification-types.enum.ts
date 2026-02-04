// config/notification-types.enum.ts
export enum NotificationType {
  // Platform - Immediate
  ACCOUNT_CONFIRMATION = 'account_confirmation',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  PAYMENT_SUCCESS = 'payment_success',
  PROFESSIONAL_INVITATION = 'professional_invitation',

  // Platform - Scheduled
  PLAN_EXPIRING_7D = 'plan_expiring_7d',
  PLAN_EXPIRED = 'plan_expired',
  FREE_TRIAL_ENDING_3D = 'free_trial_ending_3d',
  ADD_PAYMENT_METHOD_REMINDER = 'add_payment_method_reminder',
  WHATSAPP_LIMIT_REACHED = 'whatsapp_limit_reached',

  // Business - Immediate
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  AUTH_OTP = 'auth_otp',

  // Business - Scheduled
  APPOINTMENT_REMINDER_24H = 'appointment_reminder_24h',
  APPOINTMENT_REMINDER_2H = 'appointment_reminder_2h',
  POST_APPOINTMENT_THANKYOU = 'post_appointment_thankyou',
  REBOOKING_REMINDER = 'rebooking_reminder',
}

export enum NotificationChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum NotificationLayer {
  PLATFORM = 'platform',
  BUSINESS = 'business',
}
