-- AlterTable
ALTER TABLE "staffs" ADD COLUMN     "is_professional" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "type" CHAR(50) NOT NULL,
    "layer" CHAR(50) NOT NULL,
    "business_id" TEXT,
    "user_id" TEXT,
    "recipient_email" TEXT,
    "recipient_phone" TEXT,
    "appointment_id" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" CHAR(50) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "template_variables" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "layer" TEXT NOT NULL,
    "businessId" TEXT,
    "recipientId" TEXT,
    "status" TEXT NOT NULL,
    "cost" DECIMAL(6,4) NOT NULL,
    "error" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "scheduled_notification_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_limits" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "whatsappLimit" INTEGER NOT NULL DEFAULT 0,
    "professionalLimit" INTEGER NOT NULL DEFAULT 1,
    "whatsappCount" INTEGER NOT NULL DEFAULT 0,
    "emailCount" INTEGER NOT NULL DEFAULT 0,
    "whatsappCost" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "period_month_start" TIMESTAMP(3) NOT NULL,
    "period_month_end" TIMESTAMP(3) NOT NULL,
    "last_reset_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_notifications_status_scheduled_for_idx" ON "scheduled_notifications"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "scheduled_notifications_business_id_idx" ON "scheduled_notifications"("business_id");

-- CreateIndex
CREATE INDEX "scheduled_notifications_appointment_id_idx" ON "scheduled_notifications"("appointment_id");

-- CreateIndex
CREATE INDEX "notification_logs_businessId_created_at_idx" ON "notification_logs"("businessId", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_limits_business_id_key" ON "business_limits"("business_id");

-- CreateIndex
CREATE INDEX "business_limits_business_id_idx" ON "business_limits"("business_id");

-- AddForeignKey
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_limits" ADD CONSTRAINT "business_limits_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
