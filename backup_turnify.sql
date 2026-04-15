--
-- PostgreSQL database cluster dump
--

\restrict 2t4h2MEtstGAhUGErVwY8W1FiY4jN3kAmGPN6awQeBDcTEY8ML3s9i9EAuhFs2l

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:D0xnLcAy4VzmQHcsOTgXag==$fvV2FLzHTT0rUO/ZJMvmDNC9PntXk4T+uH5v4b39teY=:Bro+eq5PVOKjqcTc7uy19+UddECl8RV3uFtmHWCS3fs=';

--
-- User Configurations
--








\unrestrict 2t4h2MEtstGAhUGErVwY8W1FiY4jN3kAmGPN6awQeBDcTEY8ML3s9i9EAuhFs2l

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict u1disjhaXZkzmcKA31KWTkPowkAOLZdQvOETKMSLhdsKeitgrIqgOwT5R4pzuVG

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict u1disjhaXZkzmcKA31KWTkPowkAOLZdQvOETKMSLhdsKeitgrIqgOwT5R4pzuVG

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict mc0bnrpEig5adaCoE2yGFY0T3eYlzAHbeRScZ2g4FeV2OzwtwV3v1PMDTGVrbAI

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict mc0bnrpEig5adaCoE2yGFY0T3eYlzAHbeRScZ2g4FeV2OzwtwV3v1PMDTGVrbAI

--
-- Database "turnify_db" dump
--

--
-- PostgreSQL database dump
--

\restrict rfSSRJjYab1fjKwMt9lLgRVscgyIVJklSkHZqDhWta2Zwxd9BVMvotiNken1BmW

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: turnify_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE turnify_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE turnify_db OWNER TO postgres;

\unrestrict rfSSRJjYab1fjKwMt9lLgRVscgyIVJklSkHZqDhWta2Zwxd9BVMvotiNken1BmW
\connect turnify_db
\restrict rfSSRJjYab1fjKwMt9lLgRVscgyIVJklSkHZqDhWta2Zwxd9BVMvotiNken1BmW

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
    'NO_SHOW'
);


ALTER TYPE public."AppointmentStatus" OWNER TO postgres;

--
-- Name: AuthProvider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuthProvider" AS ENUM (
    'EMAIL',
    'GOOGLE'
);


ALTER TYPE public."AuthProvider" OWNER TO postgres;

--
-- Name: BillingCycle; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BillingCycle" AS ENUM (
    'MONTHLY',
    'YEARLY'
);


ALTER TYPE public."BillingCycle" OWNER TO postgres;

--
-- Name: TenantType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TenantType" AS ENUM (
    'BARBERSHOP',
    'HAIRDRESSING_SALON',
    'AESTHETIC_CENTER',
    'SPA_SALON',
    'BEAUTY_SALON',
    'NAIL_SALON',
    'TATTOO_AND_PIERCING',
    'OTHER'
);


ALTER TYPE public."TenantType" OWNER TO postgres;

--
-- Name: EventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EventType" AS ENUM (
    'BUSINESS_CREATED',
    'BUSINESS_DELETED',
    'SUBSCRIPTION_UPGRADED',
    'SUBSCRIPTION_DOWNGRADED',
    'SUBSCRIPTION_CANCELLED',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'LIMIT_EXCEEDED',
    'FEATURE_USED',
    'ERROR_OCCURRED'
);


ALTER TYPE public."EventType" OWNER TO postgres;

--
-- Name: NotificationChannel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationChannel" AS ENUM (
    'WHATSAPP',
    'EMAIL',
    'SMS'
);


ALTER TYPE public."NotificationChannel" OWNER TO postgres;

--
-- Name: NotificationLayer; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationLayer" AS ENUM (
    'PLATFORM',
    'BUSINESS'
);


ALTER TYPE public."NotificationLayer" OWNER TO postgres;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'SENT',
    'FAILED',
    'PENDING',
    'CANCELLED'
);


ALTER TYPE public."NotificationStatus" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'ACCOUNT_CONFIRMATION',
    'WELCOME',
    'PASSWORD_RESET',
    'PLAN_EXPIRES_7D',
    'PLAN_EXPIRES_3D',
    'PLAN_EXPIRED',
    'APPOINTMENT_CONFIRMATION',
    'APPOINTMENT_REMINDER_24H',
    'APPOINTMENT_REMINDER_2H',
    'APPOINTMENT_CANCELLED',
    'AUTH_OTP',
    'POST_APPOINTMENT_THANKYOU'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PlanType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PlanType" AS ENUM (
    'FREE',
    'PRO',
    'TEAM'
);


ALTER TYPE public."PlanType" OWNER TO postgres;

--
-- Name: PlatformAdminLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PlatformAdminLevel" AS ENUM (
    'GOD',
    'MODERATOR',
    'SUPPORTY'
);


ALTER TYPE public."PlatformAdminLevel" OWNER TO postgres;

--
-- Name: ScheduledNotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ScheduledNotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."ScheduledNotificationStatus" OWNER TO postgres;

--
-- Name: StaffRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StaffRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'PROFESSIONAL'
);


ALTER TYPE public."StaffRole" OWNER TO postgres;

--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'TRIAL',
    'ACTIVE',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
    'SUSPENDED',
    'PENDING_PAYMENT'
);


ALTER TYPE public."SubscriptionStatus" OWNER TO postgres;

--
-- Name: VerificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VerificationType" AS ENUM (
    'AUTH_CODE',
    'APPOINTMENT',
    'PASSWORD_RESET',
    'EMAIL_CONFIRM',
    'PHONE_CONFIRM',
    'MAGIC_LINK'
);


ALTER TYPE public."VerificationType" OWNER TO postgres;

--
-- Name: WebhookStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WebhookStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'PROCESSED',
    'FAILED',
    'ERROR'
);


ALTER TYPE public."WebhookStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: admin_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_events (
    id text NOT NULL,
    event_type public."EventType" NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    user_id text,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.admin_events OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id text NOT NULL,
    tenant_id text NOT NULL,
    service_id text NOT NULL,
    staff_member_id text NOT NULL,
    customer_id text NOT NULL,
    start_time timestamp(3) without time zone NOT NULL,
    end_time timestamp(3) without time zone NOT NULL,
    status public."AppointmentStatus" DEFAULT 'CONFIRMED'::public."AppointmentStatus" NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text,
    notes text,
    internal_notes text,
    confirmation_code text NOT NULL,
    cancelled_at timestamp(3) without time zone,
    cancellation_reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: tenant_daily_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_daily_stats (
    id text NOT NULL,
    tenant_id text NOT NULL,
    date date NOT NULL,
    appointments integer DEFAULT 0 NOT NULL,
    confirmed integer DEFAULT 0 NOT NULL,
    cancelled integer DEFAULT 0 NOT NULL,
    completed integer DEFAULT 0 NOT NULL,
    no_show integer DEFAULT 0 NOT NULL,
    revenue numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.tenant_daily_stats OWNER TO postgres;

--
-- Name: tenant_daily_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_daily_usage (
    id text NOT NULL,
    tenant_id text NOT NULL,
    day integer NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "messagesUsage" integer DEFAULT 0 NOT NULL,
    "otpUsage" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tenant_daily_usage OWNER TO postgres;

--
-- Name: tenant_lifetime_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_lifetime_stats (
    id text NOT NULL,
    tenant_id text NOT NULL,
    total_appointments integer DEFAULT 0 NOT NULL,
    total_revenue numeric(10,2) DEFAULT 0 NOT NULL,
    total_customers integer DEFAULT 0 NOT NULL,
    cancellation_rate numeric(5,2) DEFAULT 0 NOT NULL,
    no_show_rate numeric(5,2) DEFAULT 0 NOT NULL
);


ALTER TABLE public.tenant_lifetime_stats OWNER TO postgres;

--
-- Name: tenant_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_limits (
    id text NOT NULL,
    tenant_id text NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    last_reset_at timestamp(3) without time zone NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    period_month integer NOT NULL,
    period_year integer NOT NULL,
    email_count integer DEFAULT 0 NOT NULL,
    professional_limit integer DEFAULT 1 NOT NULL,
    whatsapp_cost numeric(6,4) DEFAULT 0 NOT NULL,
    whatsapp_count integer DEFAULT 0 NOT NULL,
    whatsapp_limit integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.tenant_limits OWNER TO postgres;

--
-- Name: tenant_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_settings (
    id text NOT NULL,
    slot_interval_minutes integer DEFAULT 30 NOT NULL,
    max_advanced_days integer DEFAULT 30 NOT NULL,
    min_advanced_minutes integer DEFAULT 30 NOT NULL,
    cancellation_window_minutes integer DEFAULT 30 NOT NULL,
    timezone text DEFAULT 'America/Montevideo'::text NOT NULL,
    currency text DEFAULT 'UYU'::text NOT NULL,
    tenant_id text NOT NULL,
    buffer_time_minutes integer DEFAULT 0 NOT NULL,
    holiday_closure_auto_apply boolean DEFAULT false NOT NULL,
    max_pending_appts_per_client integer DEFAULT 10 NOT NULL,
    require_confirmation boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tenant_settings OWNER TO postgres;

--
-- Name: tenant_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_usage (
    id text NOT NULL,
    tenant_id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    messages_usage integer DEFAULT 0 NOT NULL,
    otp_usage integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tenant_usage OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id text NOT NULL,
    owner_id text NOT NULL,
    name text,
    slug text,
    type public."TenantType",
    description text,
    phone text,
    logo_url text,
    logo_public_id text,
    cover_url text,
    cover_public_id text,
    onboarding_step integer DEFAULT 1 NOT NULL,
    onboarding_completed boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    address_line_1 text,
    address_line_2 text
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id text NOT NULL,
    tenant_id text NOT NULL,
    notes text,
    internal_notes text,
    total_appointments integer DEFAULT 0 NOT NULL,
    last_appointment_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    accepts_email boolean DEFAULT true NOT NULL,
    accepts_sms boolean DEFAULT true NOT NULL,
    accepts_whatsapp boolean DEFAULT true NOT NULL,
    blocked_at timestamp(3) without time zone,
    blocked_reason text,
    cancelled_appointments integer DEFAULT 0 NOT NULL,
    completed_appointments integer DEFAULT 0 NOT NULL,
    email text,
    email_bounced boolean DEFAULT false NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    first_appointment_at timestamp(3) without time zone,
    first_name text NOT NULL,
    last_name text NOT NULL,
    no_show_count integer DEFAULT 0 NOT NULL,
    phone text NOT NULL,
    phone_country_code text DEFAULT '+598'::text NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    preferred_language text DEFAULT 'es'::text NOT NULL,
    total_spent double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: member_invites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_invites (
    id text NOT NULL,
    email text NOT NULL,
    tenant_id text NOT NULL,
    inviter_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    accepted_at timestamp(3) without time zone,
    role public."StaffRole" DEFAULT 'PROFESSIONAL'::public."StaffRole" NOT NULL
);


ALTER TABLE public.member_invites OWNER TO postgres;

--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_logs (
    id text NOT NULL,
    type text NOT NULL,
    cost numeric(6,4) NOT NULL,
    error text,
    provider text,
    "providerMessageId" text,
    scheduled_notification_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tenant_id text,
    recipient_id text,
    channel public."NotificationChannel" NOT NULL,
    layer public."NotificationLayer" NOT NULL,
    status public."NotificationStatus" NOT NULL
);


ALTER TABLE public.notification_logs OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    tenant_id text NOT NULL,
    subscription_id text,
    reference_code text NOT NULL,
    sequence_number integer NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    status_details text,
    transaction_amount numeric(10,2) NOT NULL,
    net_received_amount numeric(10,2) NOT NULL,
    transaction_currency text DEFAULT 'UYU'::text NOT NULL,
    issued_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    paid_at timestamp(3) without time zone,
    due_at timestamp(3) without time zone,
    external_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: plan_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_limits (
    id text NOT NULL,
    plan_id text NOT NULL,
    soft_monthly_limit integer NOT NULL,
    hard_monthly_limit integer NOT NULL,
    daily_otp_limit integer NOT NULL,
    daily_messages_limit integer NOT NULL,
    max_monthly_cost numeric(10,2) DEFAULT 12.00 NOT NULL
);


ALTER TABLE public.plan_limits OWNER TO postgres;

--
-- Name: plan_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plan_stats (
    id text NOT NULL,
    plan_id text NOT NULL,
    date date NOT NULL,
    new_subscribers integer DEFAULT 0 NOT NULL,
    canceled_today integer DEFAULT 0 NOT NULL,
    revenue_today numeric(12,2) DEFAULT 0 NOT NULL,
    active_subscribers integer DEFAULT 0 NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.plan_stats OWNER TO postgres;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plans (
    id text NOT NULL,
    name text NOT NULL,
    plan_type public."PlanType" DEFAULT 'FREE'::public."PlanType" NOT NULL,
    billing_cycle public."BillingCycle",
    trial_days integer DEFAULT 14 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'UYU'::text NOT NULL,
    duration integer NOT NULL,
    features jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    external_reference text
);


ALTER TABLE public.plans OWNER TO postgres;

--
-- Name: platform_admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_admins (
    id text NOT NULL,
    user_id text NOT NULL,
    level public."PlatformAdminLevel" NOT NULL
);


ALTER TABLE public.platform_admins OWNER TO postgres;

--
-- Name: platform_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_stats (
    id text NOT NULL,
    date date NOT NULL,
    new_tenants_today integer DEFAULT 0 NOT NULL,
    churned_tenants_today integer DEFAULT 0 NOT NULL,
    appointments_today integer DEFAULT 0 NOT NULL,
    revenue_today numeric(10,2) DEFAULT 0 NOT NULL,
    mrr_lost_today numeric(10,2) DEFAULT 0 NOT NULL,
    costs_today numeric(10,2) DEFAULT 0 NOT NULL,
    total_tenants integer DEFAULT 0 NOT NULL,
    total_active_subs integer DEFAULT 0 NOT NULL,
    mrr_total numeric(10,2) DEFAULT 0 NOT NULL,
    notifications_sent integer DEFAULT 0 NOT NULL,
    notifications_failed integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.platform_stats OWNER TO postgres;

--
-- Name: schedule_exceptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_exceptions (
    id text NOT NULL,
    tenant_id text NOT NULL,
    staff_member_id text,
    date date NOT NULL,
    is_closed boolean NOT NULL,
    reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    custom_start_time timestamp(3) without time zone,
    custom_end_time timestamp(3) without time zone
);


ALTER TABLE public.schedule_exceptions OWNER TO postgres;

--
-- Name: scheduled_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scheduled_notifications (
    id text NOT NULL,
    tenant_id text,
    user_id text,
    recipient_email text,
    recipient_phone text,
    appointment_id text,
    scheduled_for timestamp(3) without time zone NOT NULL,
    status character(50) NOT NULL,
    sent_at timestamp(3) without time zone,
    failed_at timestamp(3) without time zone,
    error text,
    retry_count integer DEFAULT 0 NOT NULL,
    template_variables jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    type public."NotificationType" NOT NULL,
    layer public."NotificationLayer" NOT NULL
);


ALTER TABLE public.scheduled_notifications OWNER TO postgres;

--
-- Name: service_assigments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_assigments (
    service_id text NOT NULL,
    "customPrice" numeric(10,2),
    custom_discount_percentage numeric(65,30) DEFAULT 0,
    custom_discount_fixed numeric(10,2) DEFAULT 0,
    custom_duration_minutes integer,
    is_active boolean DEFAULT true NOT NULL,
    staff_id text NOT NULL
);


ALTER TABLE public.service_assigments OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id text NOT NULL,
    tenant_id text NOT NULL,
    name text NOT NULL,
    image text,
    description text,
    initial_active_minutes integer DEFAULT 0 NOT NULL,
    passive_time_minutes integer DEFAULT 0 NOT NULL,
    final_active_minutes integer DEFAULT 0 NOT NULL,
    duration_minutes integer DEFAULT 30 NOT NULL,
    price numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    discount_fixed numeric(10,2) DEFAULT 0,
    discount_percentage numeric(65,30) DEFAULT 0
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    jti text NOT NULL,
    user_id text NOT NULL,
    ip_address text,
    user_agent text,
    last_used_at timestamp(3) without time zone,
    revoked_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    device_id text NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: staff_lifetime_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_lifetime_stats (
    id text NOT NULL,
    staff_member_id text NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    total_appointments integer DEFAULT 0 NOT NULL,
    no_show_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.staff_lifetime_stats OWNER TO postgres;

--
-- Name: staff_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_stats (
    id text NOT NULL,
    staff_member_id text NOT NULL,
    date date NOT NULL,
    appointments_count integer DEFAULT 0 NOT NULL,
    revenue numeric(10,2) DEFAULT 0 NOT NULL,
    most_sold_service_id text,
    new_customers_count integer NOT NULL
);


ALTER TABLE public.staff_stats OWNER TO postgres;

--
-- Name: staffs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staffs (
    id text NOT NULL,
    user_id text NOT NULL,
    tenant_id text NOT NULL,
    slot_interval_minutes integer DEFAULT 30 NOT NULL,
    max_advanced_days integer DEFAULT 30 NOT NULL,
    min_advanced_minutes integer DEFAULT 30 NOT NULL,
    title text,
    bio text,
    avatar_url text,
    avatar_public_id text,
    is_active boolean DEFAULT true NOT NULL,
    display_name text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone,
    role public."StaffRole" DEFAULT 'PROFESSIONAL'::public."StaffRole" NOT NULL,
    is_professional boolean DEFAULT true NOT NULL
);


ALTER TABLE public.staffs OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    tenant_id text NOT NULL,
    plan_id text NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'TRIAL'::public."SubscriptionStatus" NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    billing_cycle public."BillingCycle",
    current_period_start timestamp(3) without time zone,
    current_period_end timestamp(3) without time zone,
    next_payment_date timestamp(3) without time zone,
    trial_ends_at timestamp(3) without time zone,
    trial_used_at timestamp(3) without time zone,
    discount_percent integer DEFAULT 0 NOT NULL,
    discount_amount numeric(65,30) DEFAULT 0 NOT NULL,
    discount_expires_at timestamp(3) without time zone,
    cancelled_at timestamp(3) without time zone,
    cancel_reason text,
    payment_method text,
    payment_provider text,
    external_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    deleted_at timestamp(3) without time zone
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text,
    name text NOT NULL,
    phone text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email_verified_at timestamp(3) without time zone,
    google_id text,
    last_login_at timestamp(3) without time zone,
    phone_verified_at timestamp(3) without time zone,
    token_version integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    avatar_url text,
    ip_address text,
    user_agent text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verification_locks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_locks (
    id text NOT NULL,
    address text NOT NULL,
    locked_until timestamp(3) without time zone NOT NULL,
    reason text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id text NOT NULL
);


ALTER TABLE public.verification_locks OWNER TO postgres;

--
-- Name: verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verifications (
    id text NOT NULL,
    type public."VerificationType" NOT NULL,
    address text NOT NULL,
    code_hash text,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    verified_at timestamp(3) without time zone,
    locked_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id text NOT NULL,
    token_hash text
);


ALTER TABLE public.verifications OWNER TO postgres;

--
-- Name: webhook_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_logs (
    id text NOT NULL,
    provider text NOT NULL,
    request_id text NOT NULL,
    type text NOT NULL,
    resource_id text,
    status public."WebhookStatus" NOT NULL,
    error text,
    payload jsonb,
    received_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.webhook_logs OWNER TO postgres;

--
-- Name: working_hours; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.working_hours (
    id text NOT NULL,
    tenant_id text NOT NULL,
    staff_member_id text,
    day_of_week integer NOT NULL,
    "startTime" time without time zone NOT NULL,
    "endTime" time without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.working_hours OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
aa71f7a0-2855-475d-8248-31dc1e17d03c	25ea28dd2f7ba20805c806e0a525c0df21a5c310b0e5335b36198e90553d8b47	2026-01-30 22:31:08.49663+00	20260125014416_init	\N	\N	2026-01-30 22:31:08.387904+00	1
5cfa2507-d2ed-42dd-933f-4795ed499725	6eb4f6aca0d9129336a95df32102711ad543b19428b5caab3f9d9d97eb6ca863	2026-01-30 22:31:08.50031+00	20260125014938_modifying_plan	\N	\N	2026-01-30 22:31:08.497222+00	1
36de8f54-89d9-4824-b827-b04aebe1105f	c3972925539fd3de28a059a30fb0037a02af322d7b5bef041d29954cbe156bdd	2026-02-02 02:16:53.103502+00	20260202021653_add_new_notification_type	\N	\N	2026-02-02 02:16:53.097194+00	1
3dc05da1-b43f-475e-9e16-a4a9ac77fb47	42a7d6437ae4dcbdacad199bfa3249494bfbb3a85cc2078a98d285794b9f736c	2026-01-30 22:31:08.50252+00	20260126220554_adding_customer_stats_and_tenant_settings	\N	\N	2026-01-30 22:31:08.500814+00	1
ab2a1aad-45d9-4601-bf66-c2acc581edb8	ab14469281e98631f8f8cf5788f609564c1445256cfe49c086e17c3289b9d577	2026-01-30 22:31:08.51681+00	20260128212505_change_staff_profile_by_professionals	\N	\N	2026-01-30 22:31:08.503135+00	1
80026b54-e793-4334-beb5-80fd6f697e25	f29f36760df06f1f979c5862d9525788195df93bb4c24d4bab3c0d5037cd7191	2026-01-30 22:31:08.522003+00	20260129043612_add_service_assigment	\N	\N	2026-01-30 22:31:08.517292+00	1
273615a2-0a5d-473b-a2f6-77c8ff944833	8f7cc86d606ecb1f0086dab3ae689dcde7dee0d12d0e003881b83fdaaff8be6a	2026-02-02 05:55:05.211823+00	20260202055505_scheduled_notification_optinal	\N	\N	2026-02-02 05:55:05.202654+00	1
78c6200b-c4a4-488a-a5cd-1a4237f57be6	d3ebe80687e074793376f960db3117b73ef6ec2bd8d5e6c2502997b41976838c	2026-01-30 22:31:08.523682+00	20260129044716_optional_values	\N	\N	2026-01-30 22:31:08.522472+00	1
26d74f5e-57a5-460a-b296-c75ba2005497	d4ece2ccaf0d4a400ad185d1584be0ad53b6f9e929466c1fa65cdf1cba908df6	2026-01-30 22:31:08.526773+00	20260129044947_correcting_professional_word	\N	\N	2026-01-30 22:31:08.52414+00	1
2c1cc59a-8731-4feb-bd3f-a27195155ad0	f17e028d8da6b0fe920f841c6fcea82f58c4e85d5ed142e48cd2f004734c1fd4	2026-01-30 22:32:24.493347+00	20260130223224_lot_of_changes	\N	\N	2026-01-30 22:32:24.471104+00	1
25bd98a6-a478-4917-8d06-91d9d6964dff	d6c36d8c691cb40c5a2a9282fbe91c8d87018cfd20d8f080b310c2bf15c328a3	2026-02-05 05:06:33.090248+00	20260205050633_add_customer	\N	\N	2026-02-05 05:06:33.061895+00	1
f65650bb-dc11-42fb-86d3-9aa540449cda	2bf99efdd32438ccde8e16415bf8e3d80ae83bca9fef79c27fcf83797980cc2d	2026-01-30 22:32:53.692403+00	20260130223253_add_platform_admin_map	\N	\N	2026-01-30 22:32:53.679032+00	1
5cb9a68f-1c88-4dcf-bfe9-eafa202b8e17	a262339f6cecd056c3ee608b22c55f2895eadda14afdabeba3d59d063dc5923a	2026-01-30 22:56:57.810821+00	20260130225657_add_staff_role_to_staff	\N	\N	2026-01-30 22:56:57.803436+00	1
3e32bebf-9f8e-417e-988c-b79c42dd5ad0	7fdef061531ed7cc65405b600c2a89a45a6264ef54333b93a408c035c41ebb22	2026-01-31 19:53:15.01021+00	20260131195314_add_scheduled_notifcaitons_logs_limits	\N	\N	2026-01-31 19:53:14.985673+00	1
84703a19-e2d1-4cef-b3b7-1afdc80ebca2	f6a6bf965fba0f501aad149461a3c2b8492e45ae6e17c74d830c388d3b87d1bd	2026-02-06 00:55:11.641759+00	20260206005511_add_token_hash	\N	\N	2026-02-06 00:55:11.632099+00	1
80804df4-70d7-41ac-8ada-e3e1b32f673e	36a9863ae91e1613080744925cab4e110931055cb6c1223f15fcca54683ba63f	2026-01-31 23:16:40.281242+00	20260131231640_update_period_month_and_period_year	\N	\N	2026-01-31 23:16:40.275173+00	1
90498166-fbd8-4210-8143-3e21c88b06b8	92c8aff9cdc824daa17893abfda624d0bfa4e4cbcd6a9690945eb97636ef5d09	2026-02-01 20:11:34.954779+00	20260201201134_optimizing_db	\N	\N	2026-02-01 20:11:34.929764+00	1
9b57f243-ee41-4181-82a0-8eb9f1d7bc8b	baee47320124f35ed6949ca0f487b3bde390fdaac51a9e132732e3ff76b70747	2026-02-06 01:52:51.142811+00	20260206015251_add_ip_and_user_agent_to_user	\N	\N	2026-02-06 01:52:51.137437+00	1
475b218d-2f72-4fc6-9c4d-545aee833dfb	550935a77a21a4dcd0633ea96e5c313ac27f958c0a09579f499be3630cf13cd8	2026-02-06 05:50:05.525261+00	20260206055005_adding_some_map	\N	\N	2026-02-06 05:50:05.515962+00	1
23efb49d-a2ec-4c5c-8de5-9810e90ef1b4	8c13ddec363b08a0ec7c472e844d35be5a7876a9754357a1d87547f2ecd8e70f	2026-02-06 17:45:40.919204+00	20260206174540_add_device_id	\N	\N	2026-02-06 17:45:40.902689+00	1
348bdd96-2730-4fa8-88b5-b5ede0d7e140	ef8fefd544a7dc3bb3b90f1fb93e6cb9206d11791ef7cca81f6700cde47d1871	2026-02-06 17:52:16.666676+00	20260206175216_jti_plus_device_id_are_unique	\N	\N	2026-02-06 17:52:16.659749+00	1
\.


--
-- Data for Name: admin_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_events (id, event_type, entity_type, entity_id, user_id, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, tenant_id, service_id, staff_member_id, customer_id, start_time, end_time, status, customer_name, customer_phone, customer_email, notes, internal_notes, confirmation_code, cancelled_at, cancellation_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tenant_daily_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_daily_stats (id, tenant_id, date, appointments, confirmed, cancelled, completed, no_show, revenue) FROM stdin;
\.


--
-- Data for Name: tenant_daily_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_daily_usage (id, tenant_id, day, month, year, "messagesUsage", "otpUsage", "createdAt") FROM stdin;
\.


--
-- Data for Name: tenant_lifetime_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_lifetime_stats (id, tenant_id, total_appointments, total_revenue, total_customers, cancellation_rate, no_show_rate) FROM stdin;
\.


--
-- Data for Name: tenant_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_limits (id, tenant_id, plan, last_reset_at, updated_at, period_month, period_year, email_count, professional_limit, whatsapp_cost, whatsapp_count, whatsapp_limit) FROM stdin;
\.


--
-- Data for Name: tenant_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_settings (id, slot_interval_minutes, max_advanced_days, min_advanced_minutes, cancellation_window_minutes, timezone, currency, tenant_id, buffer_time_minutes, holiday_closure_auto_apply, max_pending_appts_per_client, require_confirmation) FROM stdin;
\.


--
-- Data for Name: tenant_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_usage (id, tenant_id, month, year, messages_usage, otp_usage, updated_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, owner_id, name, slug, type, description, phone, logo_url, logo_public_id, cover_url, cover_public_id, onboarding_step, onboarding_completed, created_at, updated_at, deleted_at, address_line_1, address_line_2) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, tenant_id, notes, internal_notes, total_appointments, last_appointment_at, created_at, updated_at, deleted_at, accepts_email, accepts_sms, accepts_whatsapp, blocked_at, blocked_reason, cancelled_appointments, completed_appointments, email, email_bounced, email_verified, first_appointment_at, first_name, last_name, no_show_count, phone, phone_country_code, phone_verified, preferred_language, total_spent) FROM stdin;
\.


--
-- Data for Name: member_invites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.member_invites (id, email, tenant_id, inviter_id, token, expires_at, accepted_at, role) FROM stdin;
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_logs (id, type, cost, error, provider, "providerMessageId", scheduled_notification_id, created_at, tenant_id, recipient_id, channel, layer, status) FROM stdin;
5f40be0c-dac4-4bbb-bda5-91660e5dc7c8	ACCOUNT_CONFIRMATION	0.0000	\N	resend	3bf3671a-1b0c-474f-8e36-b766c3530c48	\N	2026-02-06 05:44:55.9	\N	\N	EMAIL	PLATFORM	SENT
f79bf663-1364-4b57-8bda-137ab675694e	ACCOUNT_CONFIRMATION	0.0000	\N	resend	b494283f-c3f5-4d3e-ac90-8314d36f2080	\N	2026-02-06 05:46:44.601	\N	\N	EMAIL	PLATFORM	SENT
900d1477-eaae-4364-b5fa-bd8ae626b40a	ACCOUNT_CONFIRMATION	0.0000	\N	resend	f1e04767-6bb4-4571-999b-c3bee41affa9	\N	2026-02-06 18:19:51.22	\N	\N	EMAIL	PLATFORM	SENT
3c4a5242-4850-4df1-b007-da0bd4fe568b	ACCOUNT_CONFIRMATION	0.0000	\N	resend	8c8de92a-0255-484a-bce1-bad7f90d3c26	\N	2026-02-06 19:00:34.051	\N	\N	EMAIL	PLATFORM	SENT
3a2e59a7-baf0-4fff-b039-73db9dc44a99	ACCOUNT_CONFIRMATION	0.0000	\N	resend	a9ac5444-87a2-440b-83b0-77b6a1cb1d7e	\N	2026-02-06 19:08:23.609	\N	\N	EMAIL	PLATFORM	SENT
3fe22803-ce7a-4cbd-a5fd-1309327efd35	ACCOUNT_CONFIRMATION	0.0000	\N	resend	020a6253-e7bb-4fa1-a856-9fdf6cfb9599	\N	2026-02-06 19:11:34.003	\N	\N	EMAIL	PLATFORM	SENT
90e7f63e-de0a-4725-a926-154ad84a2010	ACCOUNT_CONFIRMATION	0.0000	\N	resend	84da50b2-ec0b-43a4-a8a9-6913dd2553cb	\N	2026-02-06 20:02:46.668	\N	\N	EMAIL	PLATFORM	SENT
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, tenant_id, subscription_id, reference_code, sequence_number, status, status_details, transaction_amount, net_received_amount, transaction_currency, issued_at, paid_at, due_at, external_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: plan_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plan_limits (id, plan_id, soft_monthly_limit, hard_monthly_limit, daily_otp_limit, daily_messages_limit, max_monthly_cost) FROM stdin;
\.


--
-- Data for Name: plan_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plan_stats (id, plan_id, date, new_subscribers, canceled_today, revenue_today, active_subscribers, total_revenue, "updatedAt") FROM stdin;
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plans (id, name, plan_type, billing_cycle, trial_days, is_active, is_public, description, price, currency, duration, features, created_at, updated_at, external_reference) FROM stdin;
\.


--
-- Data for Name: platform_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_admins (id, user_id, level) FROM stdin;
\.


--
-- Data for Name: platform_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.platform_stats (id, date, new_tenants_today, churned_tenants_today, appointments_today, revenue_today, mrr_lost_today, costs_today, total_tenants, total_active_subs, mrr_total, notifications_sent, notifications_failed, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: schedule_exceptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedule_exceptions (id, tenant_id, staff_member_id, date, is_closed, reason, created_at, custom_start_time, custom_end_time) FROM stdin;
\.


--
-- Data for Name: scheduled_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scheduled_notifications (id, tenant_id, user_id, recipient_email, recipient_phone, appointment_id, scheduled_for, status, sent_at, failed_at, error, retry_count, template_variables, created_at, updated_at, type, layer) FROM stdin;
\.


--
-- Data for Name: service_assigments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_assigments (service_id, "customPrice", custom_discount_percentage, custom_discount_fixed, custom_duration_minutes, is_active, staff_id) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, tenant_id, name, image, description, initial_active_minutes, passive_time_minutes, final_active_minutes, duration_minutes, price, is_active, display_order, created_at, updated_at, deleted_at, discount_fixed, discount_percentage) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, jti, user_id, ip_address, user_agent, last_used_at, revoked_at, expires_at, created_at, updated_at, device_id) FROM stdin;
5e72c765-716d-4f1b-a268-5284a6ad6a0a	019c349c-3a6c-742c-91bf-e9ff5aa49d6a	2e802f88-b1c7-4ff0-82b8-40dca17f1c04	::1	mozilla/5.0 (linux; android 6.0; nexus 5 build/mra58n) applewebkit/537.36 (khtml, like gecko) chrome/144.0.0.0 mobile safari/537.36	2026-02-06 20:19:39.756	\N	2026-03-08 20:19:39.756	2026-02-06 20:19:39.759	2026-02-06 20:19:39.759	019c349c-3a6c-742c-91bf-ec3286710200
0e32cf5a-2305-4e29-b957-7f8e1a878621	019c349c-8c12-757c-8e63-724a42f93de5	2e802f88-b1c7-4ff0-82b8-40dca17f1c04	::1	mozilla/5.0 (linux; android 6.0; nexus 5 build/mra58n) applewebkit/537.36 (khtml, like gecko) chrome/144.0.0.0 mobile safari/537.36	2026-02-06 20:20:00.658	\N	2026-03-08 20:20:00.658	2026-02-06 20:20:00.66	2026-02-06 20:20:00.66	019c349c-8c12-757c-8e63-7499b9ac6b14
515e786a-0a03-4110-b149-ede20db63cee	019c34a2-e230-76f6-b986-b9a7ac67970a	2e802f88-b1c7-4ff0-82b8-40dca17f1c04	::1	mozilla/5.0 (linux; android 6.0; nexus 5 build/mra58n) applewebkit/537.36 (khtml, like gecko) chrome/144.0.0.0 mobile safari/537.36	2026-02-06 20:26:55.921	\N	2026-03-08 20:26:55.92	2026-02-06 20:26:55.93	2026-02-06 20:26:55.93	019c34a2-e230-76f6-b986-be4df3ca32db
026e5a4c-3b12-441e-baf3-55c70eaf85e3	019c3553-c818-725e-ba31-057561149c61	2e802f88-b1c7-4ff0-82b8-40dca17f1c04	::1	mozilla/5.0 (linux; android 6.0; nexus 5 build/mra58n) applewebkit/537.36 (khtml, like gecko) chrome/144.0.0.0 mobile safari/537.36	2026-02-06 23:40:09.112	\N	2026-03-08 23:40:09.112	2026-02-06 23:40:09.126	2026-02-06 23:40:09.126	019c34a2-e230-76f6-b986-be4df3ca32db
\.


--
-- Data for Name: staff_lifetime_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_lifetime_stats (id, staff_member_id, total_revenue, total_appointments, no_show_count) FROM stdin;
\.


--
-- Data for Name: staff_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_stats (id, staff_member_id, date, appointments_count, revenue, most_sold_service_id, new_customers_count) FROM stdin;
\.


--
-- Data for Name: staffs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staffs (id, user_id, tenant_id, slot_interval_minutes, max_advanced_days, min_advanced_minutes, title, bio, avatar_url, avatar_public_id, is_active, display_name, display_order, created_at, updated_at, deleted_at, role, is_professional) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, tenant_id, plan_id, status, amount, currency, billing_cycle, current_period_start, current_period_end, next_payment_date, trial_ends_at, trial_used_at, discount_percent, discount_amount, discount_expires_at, cancelled_at, cancel_reason, payment_method, payment_provider, external_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, phone, created_at, email_verified_at, google_id, last_login_at, phone_verified_at, token_version, updated_at, avatar_url, ip_address, user_agent) FROM stdin;
2e802f88-b1c7-4ff0-82b8-40dca17f1c04	ivanrms371@gmail.com	$2b$10$TsHaSAeCFR8nMBzBwMaJ4.oBdqDfEHdkp8KIzF0Fdq9Ua5Wu6UoVS	Iván	+59899612953	2026-02-06 20:02:45.09	2026-02-06 20:03:25.207	104040757253117213898	\N	\N	0	2026-02-06 20:04:22.173	\N	::1	postmanruntime/7.51.1
\.


--
-- Data for Name: verification_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_locks (id, address, locked_until, reason, created_at, user_id) FROM stdin;
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verifications (id, type, address, code_hash, attempts, max_attempts, expires_at, verified_at, locked_at, created_at, user_id, token_hash) FROM stdin;
abdf30b3-585e-4690-a756-fdc727058bbf	EMAIL_CONFIRM	ivanrms371@gmail.com	\N	0	3	2026-02-06 21:02:45.101	2026-02-06 20:03:25.198	\N	2026-02-06 20:02:45.105	2e802f88-b1c7-4ff0-82b8-40dca17f1c04	17a60c3e035743ec365b9ecc38041cc19a50f7cf6dabc7c5f846bd7572ebc74b
\.


--
-- Data for Name: webhook_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_logs (id, provider, request_id, type, resource_id, status, error, payload, received_at, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: working_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.working_hours (id, tenant_id, staff_member_id, day_of_week, "startTime", "endTime", is_active, created_at) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_events admin_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_events
    ADD CONSTRAINT admin_events_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: tenant_daily_stats tenant_daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_daily_stats
    ADD CONSTRAINT tenant_daily_stats_pkey PRIMARY KEY (id);


--
-- Name: tenant_daily_usage tenant_daily_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_daily_usage
    ADD CONSTRAINT tenant_daily_usage_pkey PRIMARY KEY (id);


--
-- Name: tenant_lifetime_stats tenant_lifetime_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_lifetime_stats
    ADD CONSTRAINT tenant_lifetime_stats_pkey PRIMARY KEY (id);


--
-- Name: tenant_limits tenant_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_limits
    ADD CONSTRAINT tenant_limits_pkey PRIMARY KEY (id);


--
-- Name: tenant_settings tenant_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_usage tenant_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_usage
    ADD CONSTRAINT tenant_usage_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: member_invites member_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_invites
    ADD CONSTRAINT member_invites_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: plan_limits plan_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_limits
    ADD CONSTRAINT plan_limits_pkey PRIMARY KEY (id);


--
-- Name: plan_stats plan_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_stats
    ADD CONSTRAINT plan_stats_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: platform_admins platform_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_pkey PRIMARY KEY (id);


--
-- Name: platform_stats platform_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_stats
    ADD CONSTRAINT platform_stats_pkey PRIMARY KEY (id);


--
-- Name: schedule_exceptions schedule_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_exceptions
    ADD CONSTRAINT schedule_exceptions_pkey PRIMARY KEY (id);


--
-- Name: scheduled_notifications scheduled_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_pkey PRIMARY KEY (id);


--
-- Name: service_assigments service_assigments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_assigments
    ADD CONSTRAINT service_assigments_pkey PRIMARY KEY (staff_id, service_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: staff_lifetime_stats staff_lifetime_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_lifetime_stats
    ADD CONSTRAINT staff_lifetime_stats_pkey PRIMARY KEY (id);


--
-- Name: staff_stats staff_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_stats
    ADD CONSTRAINT staff_stats_pkey PRIMARY KEY (id);


--
-- Name: staffs staffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_locks verification_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_locks
    ADD CONSTRAINT verification_locks_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: webhook_logs webhook_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_logs
    ADD CONSTRAINT webhook_logs_pkey PRIMARY KEY (id);


--
-- Name: working_hours working_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.working_hours
    ADD CONSTRAINT working_hours_pkey PRIMARY KEY (id);


--
-- Name: admin_events_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admin_events_created_at_idx ON public.admin_events USING btree (created_at);


--
-- Name: admin_events_entity_type_entity_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admin_events_entity_type_entity_id_idx ON public.admin_events USING btree (entity_type, entity_id);


--
-- Name: admin_events_event_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX admin_events_event_type_idx ON public.admin_events USING btree (event_type);


--
-- Name: appointments_tenant_id_start_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_tenant_id_start_time_idx ON public.appointments USING btree (tenant_id, start_time);


--
-- Name: appointments_tenant_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_tenant_id_status_idx ON public.appointments USING btree (tenant_id, status);


--
-- Name: appointments_confirmation_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_confirmation_code_idx ON public.appointments USING btree (confirmation_code);


--
-- Name: appointments_confirmation_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX appointments_confirmation_code_key ON public.appointments USING btree (confirmation_code);


--
-- Name: appointments_customer_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_customer_id_idx ON public.appointments USING btree (customer_id);


--
-- Name: appointments_staff_member_id_start_time_status_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX appointments_staff_member_id_start_time_status_key ON public.appointments USING btree (staff_member_id, start_time, status);


--
-- Name: appointments_start_time_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX appointments_start_time_status_idx ON public.appointments USING btree (start_time, status);


--
-- Name: tenant_daily_stats_tenant_id_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenant_daily_stats_tenant_id_date_idx ON public.tenant_daily_stats USING btree (tenant_id, date);


--
-- Name: tenant_daily_stats_tenant_id_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenant_daily_stats_tenant_id_date_key ON public.tenant_daily_stats USING btree (tenant_id, date);


--
-- Name: tenant_daily_usage_tenant_id_day_month_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenant_daily_usage_tenant_id_day_month_year_idx ON public.tenant_daily_usage USING btree (tenant_id, day, month, year);


--
-- Name: tenant_daily_usage_tenant_id_day_month_year_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenant_daily_usage_tenant_id_day_month_year_key ON public.tenant_daily_usage USING btree (tenant_id, day, month, year);


--
-- Name: tenant_lifetime_stats_tenant_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenant_lifetime_stats_tenant_id_key ON public.tenant_lifetime_stats USING btree (tenant_id);


--
-- Name: tenant_limits_tenant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenant_limits_tenant_id_idx ON public.tenant_limits USING btree (tenant_id);


--
-- Name: tenant_limits_tenant_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenant_limits_tenant_id_key ON public.tenant_limits USING btree (tenant_id);


--
-- Name: tenant_settings_tenant_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenant_settings_tenant_id_key ON public.tenant_settings USING btree (tenant_id);


--
-- Name: tenant_usage_tenant_id_month_year_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenant_usage_tenant_id_month_year_idx ON public.tenant_usage USING btree (tenant_id, month, year);


--
-- Name: tenant_usage_tenant_id_month_year_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenant_usage_tenant_id_month_year_key ON public.tenant_usage USING btree (tenant_id, month, year);


--
-- Name: tenants_owner_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tenants_owner_id_idx ON public.tenants USING btree (owner_id);


--
-- Name: tenants_owner_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenants_owner_id_key ON public.tenants USING btree (owner_id);


--
-- Name: tenants_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tenants_slug_key ON public.tenants USING btree (slug);


--
-- Name: customers_tenant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_tenant_id_idx ON public.customers USING btree (tenant_id);


--
-- Name: customers_tenant_id_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_tenant_id_phone_key ON public.customers USING btree (tenant_id, phone);


--
-- Name: customers_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_email_idx ON public.customers USING btree (email);


--
-- Name: customers_last_appointment_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_last_appointment_at_idx ON public.customers USING btree (last_appointment_at);


--
-- Name: customers_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);


--
-- Name: member_invites_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX member_invites_email_idx ON public.member_invites USING btree (email);


--
-- Name: member_invites_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX member_invites_token_key ON public.member_invites USING btree (token);


--
-- Name: notification_logs_tenant_id_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_logs_tenant_id_created_at_idx ON public.notification_logs USING btree (tenant_id, created_at);


--
-- Name: notification_logs_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notification_logs_status_idx ON public.notification_logs USING btree (status);


--
-- Name: payments_tenant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_tenant_id_idx ON public.payments USING btree (tenant_id);


--
-- Name: payments_external_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_external_id_key ON public.payments USING btree (external_id);


--
-- Name: payments_reference_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_reference_code_key ON public.payments USING btree (reference_code);


--
-- Name: payments_sequence_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_sequence_number_key ON public.payments USING btree (sequence_number);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: plan_limits_plan_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plan_limits_plan_id_key ON public.plan_limits USING btree (plan_id);


--
-- Name: plan_stats_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX plan_stats_date_idx ON public.plan_stats USING btree (date);


--
-- Name: plan_stats_plan_id_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plan_stats_plan_id_date_key ON public.plan_stats USING btree (plan_id, date);


--
-- Name: plans_external_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX plans_external_reference_key ON public.plans USING btree (external_reference);


--
-- Name: platform_admins_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX platform_admins_user_id_idx ON public.platform_admins USING btree (user_id);


--
-- Name: platform_admins_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX platform_admins_user_id_key ON public.platform_admins USING btree (user_id);


--
-- Name: platform_stats_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX platform_stats_date_idx ON public.platform_stats USING btree (date);


--
-- Name: platform_stats_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX platform_stats_date_key ON public.platform_stats USING btree (date);


--
-- Name: schedule_exceptions_tenant_id_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX schedule_exceptions_tenant_id_date_idx ON public.schedule_exceptions USING btree (tenant_id, date);


--
-- Name: scheduled_notifications_appointment_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX scheduled_notifications_appointment_id_idx ON public.scheduled_notifications USING btree (appointment_id);


--
-- Name: scheduled_notifications_tenant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX scheduled_notifications_tenant_id_idx ON public.scheduled_notifications USING btree (tenant_id);


--
-- Name: scheduled_notifications_status_scheduled_for_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX scheduled_notifications_status_scheduled_for_idx ON public.scheduled_notifications USING btree (status, scheduled_for);


--
-- Name: scheduled_notifications_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX scheduled_notifications_user_id_idx ON public.scheduled_notifications USING btree (user_id);


--
-- Name: service_assigments_staff_id_is_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX service_assigments_staff_id_is_active_idx ON public.service_assigments USING btree (staff_id, is_active);


--
-- Name: services_tenant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX services_tenant_id_idx ON public.services USING btree (tenant_id);


--
-- Name: sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_expires_at_idx ON public.sessions USING btree (expires_at);


--
-- Name: sessions_jti_device_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sessions_jti_device_id_key ON public.sessions USING btree (jti, device_id);


--
-- Name: sessions_revoked_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_revoked_at_idx ON public.sessions USING btree (revoked_at);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: staff_lifetime_stats_staff_member_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX staff_lifetime_stats_staff_member_id_key ON public.staff_lifetime_stats USING btree (staff_member_id);


--
-- Name: staff_stats_date_staff_member_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX staff_stats_date_staff_member_id_idx ON public.staff_stats USING btree (date, staff_member_id);


--
-- Name: staff_stats_staff_member_id_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX staff_stats_staff_member_id_date_key ON public.staff_stats USING btree (staff_member_id, date);


--
-- Name: staffs_tenant_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX staffs_tenant_id_idx ON public.staffs USING btree (tenant_id);


--
-- Name: staffs_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX staffs_user_id_key ON public.staffs USING btree (user_id);


--
-- Name: subscriptions_tenant_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX subscriptions_tenant_id_key ON public.subscriptions USING btree (tenant_id);


--
-- Name: subscriptions_tenant_id_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_tenant_id_status_idx ON public.subscriptions USING btree (tenant_id, status);


--
-- Name: subscriptions_status_current_period_end_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_status_current_period_end_idx ON public.subscriptions USING btree (status, current_period_end);


--
-- Name: subscriptions_status_trial_ends_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subscriptions_status_trial_ends_at_idx ON public.subscriptions USING btree (status, trial_ends_at);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_google_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_google_id_idx ON public.users USING btree (google_id);


--
-- Name: users_google_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_google_id_key ON public.users USING btree (google_id);


--
-- Name: users_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_phone_idx ON public.users USING btree (phone);


--
-- Name: users_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);


--
-- Name: verification_locks_address_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_locks_address_idx ON public.verification_locks USING btree (address);


--
-- Name: verification_locks_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verification_locks_user_id_key ON public.verification_locks USING btree (user_id);


--
-- Name: verifications_address_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_address_idx ON public.verifications USING btree (address);


--
-- Name: verifications_token_hash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_token_hash_idx ON public.verifications USING btree (token_hash);


--
-- Name: verifications_token_hash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verifications_token_hash_key ON public.verifications USING btree (token_hash);


--
-- Name: verifications_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verifications_user_id_key ON public.verifications USING btree (user_id);


--
-- Name: webhook_logs_provider_request_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX webhook_logs_provider_request_id_idx ON public.webhook_logs USING btree (provider, request_id);


--
-- Name: webhook_logs_provider_request_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX webhook_logs_provider_request_id_key ON public.webhook_logs USING btree (provider, request_id);


--
-- Name: webhook_logs_received_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX webhook_logs_received_at_idx ON public.webhook_logs USING btree (received_at);


--
-- Name: webhook_logs_request_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX webhook_logs_request_id_key ON public.webhook_logs USING btree (request_id);


--
-- Name: webhook_logs_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX webhook_logs_status_idx ON public.webhook_logs USING btree (status);


--
-- Name: working_hours_tenant_id_day_of_week_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX working_hours_tenant_id_day_of_week_idx ON public.working_hours USING btree (tenant_id, day_of_week);


--
-- Name: working_hours_staff_member_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX working_hours_staff_member_id_idx ON public.working_hours USING btree (staff_member_id);


--
-- Name: appointments appointments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: appointments appointments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: appointments appointments_staff_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staffs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tenant_daily_stats tenant_daily_stats_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_daily_stats
    ADD CONSTRAINT tenant_daily_stats_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tenant_daily_usage tenant_daily_usage_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_daily_usage
    ADD CONSTRAINT tenant_daily_usage_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tenant_lifetime_stats tenant_lifetime_stats_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_lifetime_stats
    ADD CONSTRAINT tenant_lifetime_stats_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tenant_limits tenant_limits_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_limits
    ADD CONSTRAINT tenant_limits_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_settings tenant_settings_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_settings
    ADD CONSTRAINT tenant_settings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_usage tenant_usage_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_usage
    ADD CONSTRAINT tenant_usage_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tenants tenants_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: customers customers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: member_invites member_invites_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_invites
    ADD CONSTRAINT member_invites_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: member_invites member_invites_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.member_invites
    ADD CONSTRAINT member_invites_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notification_logs notification_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notification_logs notification_logs_scheduled_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_scheduled_notification_id_fkey FOREIGN KEY (scheduled_notification_id) REFERENCES public.scheduled_notifications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: plan_limits plan_limits_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_limits
    ADD CONSTRAINT plan_limits_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: plan_stats plan_stats_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plan_stats
    ADD CONSTRAINT plan_stats_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: platform_admins platform_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_admins
    ADD CONSTRAINT platform_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: schedule_exceptions schedule_exceptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_exceptions
    ADD CONSTRAINT schedule_exceptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_notifications scheduled_notifications_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_notifications scheduled_notifications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scheduled_notifications scheduled_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_notifications
    ADD CONSTRAINT scheduled_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_assigments service_assigments_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_assigments
    ADD CONSTRAINT service_assigments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: service_assigments service_assigments_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_assigments
    ADD CONSTRAINT service_assigments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staffs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: services services_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_lifetime_stats staff_lifetime_stats_staff_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_lifetime_stats
    ADD CONSTRAINT staff_lifetime_stats_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staffs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staff_stats staff_stats_staff_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_stats
    ADD CONSTRAINT staff_stats_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staffs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staffs staffs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: staffs staffs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staffs
    ADD CONSTRAINT staffs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: verification_locks verification_locks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_locks
    ADD CONSTRAINT verification_locks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: verifications verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: working_hours working_hours_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.working_hours
    ADD CONSTRAINT working_hours_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: working_hours working_hours_staff_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.working_hours
    ADD CONSTRAINT working_hours_staff_member_id_fkey FOREIGN KEY (staff_member_id) REFERENCES public.staffs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict rfSSRJjYab1fjKwMt9lLgRVscgyIVJklSkHZqDhWta2Zwxd9BVMvotiNken1BmW

--
-- PostgreSQL database cluster dump complete
--

