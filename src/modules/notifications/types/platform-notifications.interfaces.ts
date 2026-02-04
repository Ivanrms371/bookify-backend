export interface SendAccountConfirmationDto {
  userId: string;
  name: string;
  email: string;
  token: string;
}

export interface SendWelcomeDto {
  userId: string;
  name: string;
  email: string;
}

export interface SendPlanExpiringReminderDto {
  userId: string;
  businessId: string;
  ownerEmail: string;
  businessName: string;
  expirationDate: Date;
}

export interface SendPasswordResetDto {
  userId: string;
  name: string;
  email: string;
  token: string;
}
