-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('APPOINTMENT', 'PASSWORD_RESET', 'EMAIL_CONFIRM', 'PHONE_CONFIRM', 'MAGIC_LINK', 'AUTH_CODE');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'INVITED');

-- CreateEnum
CREATE TYPE "PlatformAdminLevel" AS ENUM ('GOD', 'MODERATOR', 'SUPPORTY');

-- CreateEnum
CREATE TYPE "TenantType" AS ENUM ('BARBERSHOP', 'HAIRDRESSING_SALON', 'AESTHETIC_CENTER', 'SPA_SALON', 'BEAUTY_SALON', 'NAIL_SALON', 'TATTOO_AND_PIERCING', 'OTHER');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'TEAM');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('UYU', 'USD', 'BRL');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'SUSPENDED', 'PENDING_PAYMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'PENDING');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'EMAIL', 'IN_APP');

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
    "google_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "invitation_token" TEXT,
    "jointed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "jti" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
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
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "owner_id" UUID NOT NULL,
    "name" TEXT,
    "slug" TEXT,
    "type" "TenantType",
    "description" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "province" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'UY',
    "phone" TEXT,
    "logo_url" TEXT,
    "logo_public_id" TEXT,
    "cover_url" TEXT,
    "cover_public_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_advanced_days" INTEGER NOT NULL DEFAULT 30,
    "min_advanced_minutes" INTEGER NOT NULL DEFAULT 30,
    "buffer_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "cancellation_window_minutes" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "max_pending_appts_per_client" INTEGER NOT NULL DEFAULT 10,
    "require_confirmation" BOOLEAN NOT NULL DEFAULT false,
    "holiday_closure_auto_apply" BOOLEAN NOT NULL DEFAULT false,
    "allow_passive_time_booking" BOOLEAN NOT NULL DEFAULT true,
    "time_zone" TEXT NOT NULL DEFAULT 'America/Montevideo',

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "discount_percentage" INTEGER DEFAULT 0,
    "discount_fixed" DECIMAL(10,2) DEFAULT 0,
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
    "employee_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_assigments_pkey" PRIMARY KEY ("employee_id","service_id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
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
    "commission_type" "CommissionType" DEFAULT 'PERCENTAGE',
    "commission_percent" DECIMAL(10,2) DEFAULT 0,
    "commission_fixed" DECIMAL(10,2) DEFAULT 0,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_working_hours" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "opens_at" SMALLINT NOT NULL,
    "closes_at" SMALLINT NOT NULL,

    CONSTRAINT "employee_working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_working_hours" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "opens_at" SMALLINT NOT NULL,
    "closes_at" SMALLINT NOT NULL,

    CONSTRAINT "tenant_working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_exceptions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "is_closed" BOOLEAN NOT NULL,
    "reason" TEXT,
    "days_of_week" INTEGER[],
    "employee_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_exception_blocks" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "schedule_exception_id" UUID NOT NULL,
    "opens_at" INTEGER NOT NULL,
    "closes_at" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_exception_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
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
    "first_appointment_at" TIMESTAMP(3),
    "last_appointment_at" TIMESTAMP(3),
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "completed_appointments" INTEGER NOT NULL DEFAULT 0,
    "cancelled_appointments" INTEGER NOT NULL DEFAULT 0,
    "no_show_count" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "blocked_reason" TEXT,
    "blocked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "name" TEXT NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "confirmation_code" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_fixed" DECIMAL(10,2) DEFAULT 0,
    "discount_percentage" INTEGER DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "cancel_token" TEXT,
    "cancellation_reason" TEXT,
    "reschedule_count" INTEGER NOT NULL DEFAULT 0,
    "reschedule_reason" TEXT,
    "reschedule_requested_at" TIMESTAMP(3),
    "reschedule_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_blocks" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "appointment_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_daily_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "appointments" INTEGER NOT NULL DEFAULT 0,
    "confirmed" INTEGER NOT NULL DEFAULT 0,
    "cancelled" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "no_show" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "new_customers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tenant_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_lifetime_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_customers" INTEGER NOT NULL DEFAULT 0,
    "total_cancelled" INTEGER NOT NULL DEFAULT 0,
    "total_completed" INTEGER NOT NULL DEFAULT 0,
    "total_no_show" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tenant_lifetime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "employee_member_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "appointments" INTEGER NOT NULL DEFAULT 0,
    "cancelled" INTEGER NOT NULL DEFAULT 0,
    "completed" INTEGER NOT NULL DEFAULT 0,
    "new_customers" INTEGER NOT NULL DEFAULT 0,
    "no_show" INTEGER NOT NULL DEFAULT 0,
    "tenant_id" UUID NOT NULL,

    CONSTRAINT "employee_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_lifetime_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "employee_member_id" UUID NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "total_cancelled" INTEGER NOT NULL DEFAULT 0,
    "total_completed" INTEGER NOT NULL DEFAULT 0,
    "total_new_customers" INTEGER NOT NULL DEFAULT 0,
    "total_no_show" INTEGER NOT NULL DEFAULT 0,
    "tenant_id" UUID NOT NULL,

    CONSTRAINT "employee_lifetime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID,
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
    "tenant_id" UUID NOT NULL,
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
    "notification_id" UUID,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_quotas" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
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

    CONSTRAINT "tenant_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_cycle" "BillingCycle",
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "next_payment_date" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "trial_started_at" TIMESTAMP(3),
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
    "tagline" TEXT,
    "billing_cycle" "BillingCycle",
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL,
    "compare_at_price" DECIMAL(10,2),
    "currency" "Currency" NOT NULL DEFAULT 'UYU',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "features" JSONB,
    "external_reference" TEXT,
    "appointment_limit" INTEGER NOT NULL DEFAULT -1,
    "email_limit" INTEGER NOT NULL DEFAULT 0,
    "professional_limit" INTEGER NOT NULL DEFAULT 1,
    "whatsapp_limit" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_stats" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
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
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
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
    "new_tenantes_today" INTEGER NOT NULL DEFAULT 0,
    "churned_tenantes_today" INTEGER NOT NULL DEFAULT 0,
    "appointments_today" INTEGER NOT NULL DEFAULT 0,
    "revenue_today" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mrr_lost_today" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costs_today" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_tenantes" INTEGER NOT NULL DEFAULT 0,
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
CREATE UNIQUE INDEX "memberships_invitation_token_key" ON "memberships"("invitation_token");

-- CreateIndex
CREATE INDEX "memberships_tenant_id_idx" ON "memberships"("tenant_id");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_user_id_tenant_id_key" ON "memberships"("user_id", "tenant_id");

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
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_owner_id_idx" ON "tenants"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenant_id_key" ON "tenant_settings"("tenant_id");

-- CreateIndex
CREATE INDEX "services_tenant_id_idx" ON "services"("tenant_id");

-- CreateIndex
CREATE INDEX "service_assigments_employee_id_is_active_idx" ON "service_assigments"("employee_id", "is_active");

-- CreateIndex
CREATE INDEX "employees_tenant_id_idx" ON "employees"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_tenant_id_key" ON "employees"("user_id", "tenant_id");

-- CreateIndex
CREATE INDEX "employee_working_hours_employee_id_day_of_week_idx" ON "employee_working_hours"("employee_id", "day_of_week");

-- CreateIndex
CREATE INDEX "employee_working_hours_tenant_id_day_of_week_idx" ON "employee_working_hours"("tenant_id", "day_of_week");

-- CreateIndex
CREATE INDEX "employee_working_hours_employee_id_idx" ON "employee_working_hours"("employee_id");

-- CreateIndex
CREATE INDEX "tenant_working_hours_tenant_id_day_of_week_idx" ON "tenant_working_hours"("tenant_id", "day_of_week");

-- CreateIndex
CREATE INDEX "schedule_exceptions_employee_id_idx" ON "schedule_exceptions"("employee_id");

-- CreateIndex
CREATE INDEX "schedule_exceptions_employee_id_start_date_end_date_idx" ON "schedule_exceptions"("employee_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "schedule_exception_blocks_schedule_exception_id_idx" ON "schedule_exception_blocks"("schedule_exception_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_last_appointment_at_idx" ON "customers"("last_appointment_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_phone_key" ON "customers"("tenant_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_cancel_token_key" ON "appointments"("cancel_token");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_reschedule_token_key" ON "appointments"("reschedule_token");

-- CreateIndex
CREATE INDEX "appointments_customer_id_idx" ON "appointments"("customer_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_status_start_time_idx" ON "appointments"("tenant_id", "status", "start_time");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_employee_id_start_time_end_time_idx" ON "appointments"("tenant_id", "employee_id", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_tenant_id_confirmation_code_key" ON "appointments"("tenant_id", "confirmation_code");

-- CreateIndex
CREATE INDEX "appointment_blocks_appointment_id_idx" ON "appointment_blocks"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_blocks_employee_id_start_time_idx" ON "appointment_blocks"("employee_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_daily_stats_tenant_id_date_key" ON "tenant_daily_stats"("tenant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_lifetime_stats_tenant_id_key" ON "tenant_lifetime_stats"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_stats_tenant_id_date_idx" ON "employee_stats"("tenant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "employee_stats_employee_member_id_date_key" ON "employee_stats"("employee_member_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "employee_lifetime_stats_employee_member_id_key" ON "employee_lifetime_stats"("employee_member_id");

-- CreateIndex
CREATE INDEX "employee_lifetime_stats_tenant_id_idx" ON "employee_lifetime_stats"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_lifetime_stats_tenant_id_employee_member_id_key" ON "employee_lifetime_stats"("tenant_id", "employee_member_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notification_deliveries_notification_id_idx" ON "notification_deliveries"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_notification_id_channel_key" ON "notification_deliveries"("notification_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "in_app_notifications_notification_id_key" ON "in_app_notifications"("notification_id");

-- CreateIndex
CREATE INDEX "in_app_notifications_tenant_id_idx" ON "in_app_notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "in_app_notifications_user_id_read_at_idx" ON "in_app_notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_quotas_tenant_id_key" ON "tenant_quotas"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_quotas_tenant_id_idx" ON "tenant_quotas"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_status_idx" ON "subscriptions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_status_current_period_end_idx" ON "subscriptions"("status", "current_period_end");

-- CreateIndex
CREATE INDEX "subscriptions_status_trial_ends_at_idx" ON "subscriptions"("status", "trial_ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_external_reference_key" ON "plans"("external_reference");

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
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

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
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_locks" ADD CONSTRAINT "verification_locks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assigments" ADD CONSTRAINT "service_assigments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assigments" ADD CONSTRAINT "service_assigments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_working_hours" ADD CONSTRAINT "employee_working_hours_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_working_hours" ADD CONSTRAINT "employee_working_hours_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_working_hours" ADD CONSTRAINT "tenant_working_hours_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exceptions" ADD CONSTRAINT "schedule_exceptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exception_blocks" ADD CONSTRAINT "schedule_exception_blocks_schedule_exception_id_fkey" FOREIGN KEY ("schedule_exception_id") REFERENCES "schedule_exceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_blocks" ADD CONSTRAINT "appointment_blocks_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_daily_stats" ADD CONSTRAINT "tenant_daily_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_lifetime_stats" ADD CONSTRAINT "tenant_lifetime_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_stats" ADD CONSTRAINT "employee_stats_employee_member_id_fkey" FOREIGN KEY ("employee_member_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_stats" ADD CONSTRAINT "employee_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_lifetime_stats" ADD CONSTRAINT "employee_lifetime_stats_employee_member_id_fkey" FOREIGN KEY ("employee_member_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_lifetime_stats" ADD CONSTRAINT "employee_lifetime_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_quotas" ADD CONSTRAINT "tenant_quotas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_stats" ADD CONSTRAINT "plan_stats_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
