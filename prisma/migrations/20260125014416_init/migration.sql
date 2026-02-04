-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BUSINESS_OWNER', 'BUSINESS_ADMIN', 'PROFESIONAL');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('BARBERSHOP', 'HAIRDRESSING_SALON', 'AESTHETIC_CENTER', 'SPA_SALON', 'BEAUTY_SALON', 'NAIL_SALON', 'TATTOO_AND_PIERCING', 'OTHER');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'TEAM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'PENDING_PAYMENT');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('VERIFY_EMAIL', 'AUTH_OTP', 'APPOINTMENT_CREATED', 'APPOINTMENT_REMINDER', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'SOFT_LIMIT_WARNING', 'HARD_LIMIT_REACHED', 'BILLING_ISSUE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('SENT', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "NotificationRecipientType" AS ENUM ('BUSINESS', 'STAFF', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('AUTH_CODE', 'APPOINTMENT', 'PASSWORD_RESET', 'EMAIL_CONFIRM', 'PHONE_CONFIRM');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BUSINESS_CREATED', 'BUSINESS_DELETED', 'SUBSCRIPTION_UPGRADED', 'SUBSCRIPTION_DOWNGRADED', 'SUBSCRIPTION_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'LIMIT_EXCEEDED', 'FEATURE_USED', 'ERROR_OCCURRED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "role" "UserRole" NOT NULL DEFAULT 'BUSINESS_OWNER',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "channelPreference" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "recipient_type" "NotificationRecipientType" NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ip_at_created" TEXT,
    "token" TEXT,
    "code_hash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_locks" (
    "id" TEXT NOT NULL,
    "recipient_type" "NotificationRecipientType" NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT,
    "slug" TEXT,
    "type" "BusinessType",
    "description" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "phone" TEXT,
    "logo_url" TEXT,
    "logo_public_id" TEXT,
    "cover_url" TEXT,
    "cover_public_id" TEXT,
    "onboarding_step" INTEGER NOT NULL DEFAULT 1,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" TEXT NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_advanced_days" INTEGER NOT NULL DEFAULT 30,
    "min_advanced_minutes" INTEGER NOT NULL DEFAULT 30,
    "cancellation_window_minutes" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'America/Montevideo',
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "business_id" TEXT NOT NULL,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "initial_active_minutes" INTEGER NOT NULL DEFAULT 0,
    "passive_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "final_active_minutes" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_advanced_days" INTEGER NOT NULL DEFAULT 30,
    "min_advanced_minutes" INTEGER NOT NULL DEFAULT 30,
    "title" TEXT,
    "speciality" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "avatar_public_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PROFESIONAL',
    "business_id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "member_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_hours" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_member_id" TEXT,
    "day_of_week" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_exceptions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "staff_member_id" TEXT,
    "date" DATE NOT NULL,
    "is_closed" BOOLEAN NOT NULL,
    "custom_start_time" TEXT,
    "custom_end_time" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "last_appointment_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "staff_member_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "confirmation_code" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_daily_stats" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "appointments" INTEGER NOT NULL DEFAULT 0,
    "confirmed" INTEGER NOT NULL DEFAULT 0,
    "cancelled" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "no_show" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "business_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_lifetime_stats" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_customers" INTEGER NOT NULL DEFAULT 0,
    "cancellation_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "no_show_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "business_lifetime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_member_stats" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "appointments_count" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "most_sold_service_id" TEXT,
    "new_customers_count" INTEGER NOT NULL,

    CONSTRAINT "staff_member_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_member_lifetime_stats" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "no_show_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "staff_member_lifetime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "event" "NotificationEvent" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "recipient_type" "NotificationRecipientType" NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "recipient_address" TEXT NOT NULL,
    "business_id" TEXT,
    "appointment_id" TEXT,
    "external_ref" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_cycle" "BillingCycle",
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "next_payment_date" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "trial_used_at" TIMESTAMP(3),
    "discount_percent" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount_expires_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "payment_method" TEXT,
    "payment_provider" TEXT,
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan_type" "PlanType" NOT NULL DEFAULT 'FREE',
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "trial_days" INTEGER NOT NULL DEFAULT 14,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "duration" INTEGER NOT NULL,
    "features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "external_reference" TEXT,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "soft_monthly_limit" INTEGER NOT NULL,
    "hard_monthly_limit" INTEGER NOT NULL,
    "daily_otp_limit" INTEGER NOT NULL,
    "daily_messages_limit" INTEGER NOT NULL,
    "max_monthly_cost" DECIMAL(10,2) NOT NULL DEFAULT 12.00,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_usage" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "messages_usage" INTEGER NOT NULL DEFAULT 0,
    "otp_usage" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_daily_usage" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "messagesUsage" INTEGER NOT NULL DEFAULT 0,
    "otpUsage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_daily_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_stats" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "new_subscribers" INTEGER NOT NULL DEFAULT 0,
    "canceled_today" INTEGER NOT NULL DEFAULT 0,
    "revenue_today" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "active_subscribers" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "reference_code" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "status_details" TEXT,
    "transaction_amount" DECIMAL(10,2) NOT NULL,
    "net_received_amount" DECIMAL(10,2) NOT NULL,
    "transaction_currency" TEXT NOT NULL DEFAULT 'UYU',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "external_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "new_businesses_today" INTEGER NOT NULL DEFAULT 0,
    "churned_businesses_today" INTEGER NOT NULL DEFAULT 0,
    "appointments_today" INTEGER NOT NULL DEFAULT 0,
    "revenue_today" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mrr_lost_today" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costs_today" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_businesses" INTEGER NOT NULL DEFAULT 0,
    "total_active_subs" INTEGER NOT NULL DEFAULT 0,
    "mrr_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notifications_sent" INTEGER NOT NULL DEFAULT 0,
    "notifications_failed" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "resource_id" TEXT,
    "status" "WebhookStatus" NOT NULL,
    "error" TEXT,
    "payload" JSONB,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_events" (
    "id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_token_key" ON "verifications"("token");

-- CreateIndex
CREATE INDEX "verifications_recipient_type_recipient_id_idx" ON "verifications"("recipient_type", "recipient_id");

-- CreateIndex
CREATE INDEX "verifications_address_idx" ON "verifications"("address");

-- CreateIndex
CREATE INDEX "verification_locks_recipient_type_recipient_id_idx" ON "verification_locks"("recipient_type", "recipient_id");

-- CreateIndex
CREATE INDEX "verification_locks_address_idx" ON "verification_locks"("address");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_owner_id_key" ON "businesses"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");

-- CreateIndex
CREATE INDEX "businesses_owner_id_idx" ON "businesses"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_settings_business_id_key" ON "business_settings"("business_id");

-- CreateIndex
CREATE INDEX "services_business_id_idx" ON "services"("business_id");

-- CreateIndex
CREATE INDEX "services_staff_member_id_idx" ON "services"("staff_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_user_id_key" ON "staff_members"("user_id");

-- CreateIndex
CREATE INDEX "staff_members_business_id_idx" ON "staff_members"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_invites_token_key" ON "member_invites"("token");

-- CreateIndex
CREATE INDEX "member_invites_email_idx" ON "member_invites"("email");

-- CreateIndex
CREATE INDEX "working_hours_business_id_day_of_week_idx" ON "working_hours"("business_id", "day_of_week");

-- CreateIndex
CREATE INDEX "working_hours_staff_member_id_idx" ON "working_hours"("staff_member_id");

-- CreateIndex
CREATE INDEX "schedule_exceptions_business_id_date_idx" ON "schedule_exceptions"("business_id", "date");

-- CreateIndex
CREATE INDEX "customers_business_id_phone_idx" ON "customers"("business_id", "phone");

-- CreateIndex
CREATE INDEX "customers_business_id_idx" ON "customers"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_business_id_phone_key" ON "customers"("business_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_confirmation_code_key" ON "appointments"("confirmation_code");

-- CreateIndex
CREATE INDEX "appointments_business_id_start_time_idx" ON "appointments"("business_id", "start_time");

-- CreateIndex
CREATE INDEX "appointments_business_id_status_idx" ON "appointments"("business_id", "status");

-- CreateIndex
CREATE INDEX "appointments_customer_id_idx" ON "appointments"("customer_id");

-- CreateIndex
CREATE INDEX "appointments_confirmation_code_idx" ON "appointments"("confirmation_code");

-- CreateIndex
CREATE INDEX "appointments_start_time_status_idx" ON "appointments"("start_time", "status");

-- CreateIndex
CREATE INDEX "business_daily_stats_business_id_date_idx" ON "business_daily_stats"("business_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "business_daily_stats_business_id_date_key" ON "business_daily_stats"("business_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "business_lifetime_stats_business_id_key" ON "business_lifetime_stats"("business_id");

-- CreateIndex
CREATE INDEX "staff_member_stats_date_staff_member_id_idx" ON "staff_member_stats"("date", "staff_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_member_stats_staff_member_id_date_key" ON "staff_member_stats"("staff_member_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_member_lifetime_stats_staff_member_id_key" ON "staff_member_lifetime_stats"("staff_member_id");

-- CreateIndex
CREATE INDEX "notifications_appointment_id_idx" ON "notifications"("appointment_id");

-- CreateIndex
CREATE INDEX "notifications_sent_at_idx" ON "notifications"("sent_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_business_id_key" ON "subscriptions"("business_id");

-- CreateIndex
CREATE INDEX "subscriptions_business_id_status_idx" ON "subscriptions"("business_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_status_current_period_end_idx" ON "subscriptions"("status", "current_period_end");

-- CreateIndex
CREATE INDEX "subscriptions_status_trial_ends_at_idx" ON "subscriptions"("status", "trial_ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_external_reference_key" ON "plans"("external_reference");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limits_plan_id_key" ON "plan_limits"("plan_id");

-- CreateIndex
CREATE INDEX "business_usage_business_id_month_year_idx" ON "business_usage"("business_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "business_usage_business_id_month_year_key" ON "business_usage"("business_id", "month", "year");

-- CreateIndex
CREATE INDEX "business_daily_usage_business_id_day_month_year_idx" ON "business_daily_usage"("business_id", "day", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "business_daily_usage_business_id_day_month_year_key" ON "business_daily_usage"("business_id", "day", "month", "year");

-- CreateIndex
CREATE INDEX "plan_stats_date_idx" ON "plan_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "plan_stats_plan_id_date_key" ON "plan_stats"("plan_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_reference_code_key" ON "payments"("reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_sequence_number_key" ON "payments"("sequence_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_external_id_key" ON "payments"("external_id");

-- CreateIndex
CREATE INDEX "payments_business_id_idx" ON "payments"("business_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "platform_stats_date_idx" ON "platform_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "platform_stats_date_key" ON "platform_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_logs_request_id_key" ON "webhook_logs"("request_id");

-- CreateIndex
CREATE INDEX "webhook_logs_provider_request_id_idx" ON "webhook_logs"("provider", "request_id");

-- CreateIndex
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs"("status");

-- CreateIndex
CREATE INDEX "webhook_logs_received_at_idx" ON "webhook_logs"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_logs_provider_request_id_key" ON "webhook_logs"("provider", "request_id");

-- CreateIndex
CREATE INDEX "admin_events_event_type_idx" ON "admin_events"("event_type");

-- CreateIndex
CREATE INDEX "admin_events_entity_type_entity_id_idx" ON "admin_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "admin_events_created_at_idx" ON "admin_events"("created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_daily_stats" ADD CONSTRAINT "business_daily_stats_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_lifetime_stats" ADD CONSTRAINT "business_lifetime_stats_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_member_stats" ADD CONSTRAINT "staff_member_stats_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_member_lifetime_stats" ADD CONSTRAINT "staff_member_lifetime_stats_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_usage" ADD CONSTRAINT "business_usage_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_daily_usage" ADD CONSTRAINT "business_daily_usage_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_stats" ADD CONSTRAINT "plan_stats_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
