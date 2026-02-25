-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('APPOINTMENT', 'PASSWORD_RESET', 'EMAIL_CONFIRM', 'PHONE_CONFIRM', 'MAGIC_LINK', 'AUTH_CODE');

-- CreateEnum
CREATE TYPE "BusinessRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "PlatformAdminLevel" AS ENUM ('GOD', 'MODERATOR', 'SUPPORTY');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('BARBERSHOP', 'HAIRDRESSING_SALON', 'AESTHETIC_CENTER', 'SPA_SALON', 'BEAUTY_SALON', 'NAIL_SALON', 'TATTOO_AND_PIERCING', 'OTHER');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'TEAM');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'PENDING_PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACCOUNT_CONFIRMATION', 'PASSWORD_RESET', 'AUTH_OTP', 'TRIAL_EXPIRING_7D', 'TRIAL_EXPIRING_3D', 'TRIAL_EXPIRED', 'SUBSCRIPTION_RENEWAL_REMINDER', 'SUBSCRIPTION_RENEWED', 'PAYMENT_FAILED', 'SUBSCRIPTION_PAUSED', 'PLAN_UPGRADED', 'PLAN_DOWNGRADED', 'QUOTA_WARNING_80', 'QUOTA_EXCEEDED', 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_REMINDER_24H', 'APPOINTMENT_REMINDER_2H', 'APPOINTMENT_CANCELLED', 'POST_APPOINTMENT_THANKYOU', 'INVITATION_EMAIL');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('CUSTOMER', 'USER');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "phone" TEXT,
    "phone_verified_at" TIMESTAMP(3),
    "password" TEXT,
    "avatar_url" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "google_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_members" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "BusinessRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "jti" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_used_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" "VerificationType" NOT NULL,
    "user_id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "token_hash" TEXT,
    "code_hash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_locks" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "address" TEXT NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "owner_id" UUID NOT NULL,
    "name" TEXT,
    "slug" TEXT,
    "type" "BusinessType",
    "description" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
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
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_settings" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_advanced_days" INTEGER NOT NULL DEFAULT 30,
    "min_advanced_minutes" INTEGER NOT NULL DEFAULT 30,
    "buffer_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "cancellation_window_minutes" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'America/Montevideo',
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "max_pending_appts_per_client" INTEGER NOT NULL DEFAULT 10,
    "require_confirmation" BOOLEAN NOT NULL DEFAULT false,
    "holiday_closure_auto_apply" BOOLEAN NOT NULL DEFAULT false,
    "allow_passive_time_booking" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "business_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "discount_percentage" INTEGER DEFAULT 0,
    "discount_fixed" DECIMAL(10,2) DEFAULT 0,
    "initial_active_minutes" INTEGER NOT NULL,
    "passive_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "final_active_minutes" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_assigments" (
    "staff_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_assigments_pkey" PRIMARY KEY ("staff_id","service_id")
);

-- CreateTable
CREATE TABLE "staffs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_advanced_days" INTEGER NOT NULL DEFAULT 30,
    "min_advanced_minutes" INTEGER NOT NULL DEFAULT 30,
    "title" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "avatar_public_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "color_theme" TEXT,
    "commission_percent" DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_invites" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "email" TEXT NOT NULL,
    "business_id" UUID NOT NULL,
    "inviter_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "role" "BusinessRole" NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "member_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_hours" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staff_id" UUID,
    "end_minutes" INTEGER NOT NULL,
    "start_minutes" INTEGER NOT NULL,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_exceptions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "is_closed" BOOLEAN NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "days_of_week" INTEGER[],
    "end_date" TIMESTAMP(3) NOT NULL,
    "staff_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_exception_blocks" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "schedule_exception_id" UUID NOT NULL,
    "start_minutes" INTEGER NOT NULL,
    "end_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_exception_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_country_code" TEXT NOT NULL DEFAULT '+598',
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_bounced" BOOLEAN NOT NULL DEFAULT false,
    "accepts_whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "accepts_email" BOOLEAN NOT NULL DEFAULT true,
    "preferred_language" TEXT NOT NULL DEFAULT 'es',
    "notes" TEXT,
    "internal_notes" TEXT,
    "first_appointment_at" TIMESTAMP(3),
    "last_appointment_at" TIMESTAMP(3),
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "completed_appointments" INTEGER NOT NULL DEFAULT 0,
    "cancelled_appointments" INTEGER NOT NULL DEFAULT 0,
    "no_show_count" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blocked_reason" TEXT,
    "blocked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "next_appointment_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
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
    "discount_fixed" DECIMAL(10,2) DEFAULT 0,
    "discount_percentage" INTEGER DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL,
    "final_active_minutes" INTEGER NOT NULL,
    "initial_active_minutes" INTEGER NOT NULL,
    "passive_minutes" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_blocks" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "appointment_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_daily_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "appointments" INTEGER NOT NULL DEFAULT 0,
    "confirmed" INTEGER NOT NULL DEFAULT 0,
    "cancelled" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "no_show" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "customers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "business_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_lifetime_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_customers" INTEGER NOT NULL DEFAULT 0,
    "cancellation_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "no_show_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "business_lifetime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "staff_member_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "appointments_count" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "most_sold_service_id" TEXT,
    "new_customers_count" INTEGER NOT NULL,

    CONSTRAINT "staff_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_lifetime_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "staff_member_id" UUID NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "no_show_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "staff_lifetime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID,
    "recipient_id" TEXT NOT NULL,
    "recipient_type" "RecipientType" NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "notification_id" UUID NOT NULL,
    "reference_id" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "run_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_app_notifications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "action_url" TEXT,
    "type" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "in_app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "status" "NotificationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,
    "notification_id" UUID NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_limits" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "whatsapp_limit" INTEGER NOT NULL DEFAULT 0,
    "professional_limit" INTEGER NOT NULL DEFAULT 1,
    "whatsapp_count" INTEGER NOT NULL DEFAULT 0,
    "email_count" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_cost" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "last_reset_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "appointment_count" INTEGER NOT NULL DEFAULT 0,
    "appointment_limit" INTEGER NOT NULL DEFAULT -1,
    "email_cost" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "email_limit" INTEGER NOT NULL DEFAULT 0,
    "professional_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "business_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
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
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "plan_type" "PlanType" NOT NULL DEFAULT 'FREE',
    "billing_cycle" "BillingCycle",
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
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "plan_id" UUID NOT NULL,
    "appointment_limit" INTEGER NOT NULL DEFAULT -1,
    "email_limit" INTEGER NOT NULL DEFAULT 0,
    "professional_limit" INTEGER NOT NULL DEFAULT 1,
    "whatsapp_limit" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "plan_id" UUID NOT NULL,
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
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "subscription_id" UUID,
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
    "id" UUID NOT NULL DEFAULT uuidv7(),
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
CREATE TABLE "platform_admins" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "level" "PlatformAdminLevel" NOT NULL,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "business_members_business_id_idx" ON "business_members"("business_id");

-- CreateIndex
CREATE INDEX "business_members_user_id_idx" ON "business_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_members_user_id_business_id_key" ON "business_members"("user_id", "business_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_jti_key" ON "sessions"("jti");

-- CreateIndex
CREATE INDEX "sessions_revoked_at_idx" ON "sessions"("revoked_at");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_user_id_device_id_key" ON "sessions"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_token_hash_key" ON "verifications"("token_hash");

-- CreateIndex
CREATE INDEX "verifications_address_idx" ON "verifications"("address");

-- CreateIndex
CREATE INDEX "verifications_token_hash_idx" ON "verifications"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "verification_locks_user_id_key" ON "verification_locks"("user_id");

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
CREATE INDEX "service_assigments_staff_id_is_active_idx" ON "service_assigments"("staff_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_user_id_key" ON "staffs"("user_id");

-- CreateIndex
CREATE INDEX "staffs_business_id_idx" ON "staffs"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_user_id_business_id_key" ON "staffs"("user_id", "business_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_invites_token_key" ON "member_invites"("token");

-- CreateIndex
CREATE INDEX "member_invites_email_idx" ON "member_invites"("email");

-- CreateIndex
CREATE INDEX "working_hours_staff_id_day_of_week_idx" ON "working_hours"("staff_id", "day_of_week");

-- CreateIndex
CREATE INDEX "working_hours_business_id_day_of_week_idx" ON "working_hours"("business_id", "day_of_week");

-- CreateIndex
CREATE INDEX "working_hours_staff_id_idx" ON "working_hours"("staff_id");

-- CreateIndex
CREATE INDEX "schedule_exceptions_staff_id_idx" ON "schedule_exceptions"("staff_id");

-- CreateIndex
CREATE INDEX "schedule_exceptions_staff_id_start_date_end_date_idx" ON "schedule_exceptions"("staff_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "schedule_exception_blocks_schedule_exception_id_idx" ON "schedule_exception_blocks"("schedule_exception_id");

-- CreateIndex
CREATE INDEX "customers_business_id_idx" ON "customers"("business_id");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_last_appointment_at_idx" ON "customers"("last_appointment_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_business_id_phone_key" ON "customers"("business_id", "phone");

-- CreateIndex
CREATE INDEX "appointments_business_id_staff_id_start_time_end_time_idx" ON "appointments"("business_id", "staff_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "appointments_business_id_status_idx" ON "appointments"("business_id", "status");

-- CreateIndex
CREATE INDEX "appointments_customer_id_idx" ON "appointments"("customer_id");

-- CreateIndex
CREATE INDEX "appointments_start_time_status_idx" ON "appointments"("start_time", "status");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_business_id_confirmation_code_key" ON "appointments"("business_id", "confirmation_code");

-- CreateIndex
CREATE INDEX "business_daily_stats_business_id_date_idx" ON "business_daily_stats"("business_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "business_daily_stats_business_id_date_key" ON "business_daily_stats"("business_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "business_lifetime_stats_business_id_key" ON "business_lifetime_stats"("business_id");

-- CreateIndex
CREATE INDEX "staff_stats_date_staff_member_id_idx" ON "staff_stats"("date", "staff_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_stats_staff_member_id_date_key" ON "staff_stats"("staff_member_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_lifetime_stats_staff_member_id_key" ON "staff_lifetime_stats"("staff_member_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_business_id_idx" ON "notifications"("business_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_notification_id_channel_key" ON "notification_deliveries"("notification_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "in_app_notifications_notification_id_key" ON "in_app_notifications"("notification_id");

-- CreateIndex
CREATE INDEX "in_app_notifications_business_id_idx" ON "in_app_notifications"("business_id");

-- CreateIndex
CREATE INDEX "in_app_notifications_user_id_read_at_idx" ON "in_app_notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "business_limits_business_id_key" ON "business_limits"("business_id");

-- CreateIndex
CREATE INDEX "business_limits_business_id_idx" ON "business_limits"("business_id");

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
CREATE UNIQUE INDEX "platform_stats_date_key" ON "platform_stats"("date");

-- CreateIndex
CREATE INDEX "platform_stats_date_idx" ON "platform_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_user_id_key" ON "platform_admins"("user_id");

-- CreateIndex
CREATE INDEX "platform_admins_user_id_idx" ON "platform_admins"("user_id");

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

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_locks" ADD CONSTRAINT "verification_locks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assigments" ADD CONSTRAINT "service_assigments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assigments" ADD CONSTRAINT "service_assigments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exception_blocks" ADD CONSTRAINT "schedule_exception_blocks_schedule_exception_id_fkey" FOREIGN KEY ("schedule_exception_id") REFERENCES "schedule_exceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_blocks" ADD CONSTRAINT "appointment_blocks_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_daily_stats" ADD CONSTRAINT "business_daily_stats_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_lifetime_stats" ADD CONSTRAINT "business_lifetime_stats_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_stats" ADD CONSTRAINT "staff_stats_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_lifetime_stats" ADD CONSTRAINT "staff_lifetime_stats_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification_deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_limits" ADD CONSTRAINT "business_limits_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_stats" ADD CONSTRAINT "plan_stats_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
