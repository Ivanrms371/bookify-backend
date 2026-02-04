/*
  Warnings:

  - You are about to drop the column `period_month_end` on the `business_limits` table. All the data in the column will be lost.
  - You are about to drop the column `period_month_start` on the `business_limits` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `notification_logs` table. All the data in the column will be lost.
  - You are about to drop the column `recipientId` on the `notification_logs` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_id` on the `verification_locks` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_type` on the `verification_locks` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_id` on the `verifications` table. All the data in the column will be lost.
  - You are about to drop the column `recipient_type` on the `verifications` table. All the data in the column will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[staff_member_id,start_time,status]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `verification_locks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `verifications` will be added. If there are existing duplicate values, this will fail.
  - Made the column `staff_member_id` on table `appointments` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `period_month` to the `business_limits` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_year` to the `business_limits` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `channel` on the `notification_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `layer` on the `notification_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `notification_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `scheduled_notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `layer` on the `scheduled_notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `user_id` to the `verification_locks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationLayer" AS ENUM ('PLATFORM', 'BUSINESS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACCOUNT_CONFIRMATION', 'WELCOME', 'PASSWORD_RESET', 'PLAN_EXPIRES_7D', 'PLAN_EXPIRES_3D', 'PLAN_EXPIRED', 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_REMINDER_24H', 'APPOINTMENT_REMINDER_2H', 'APPOINTMENT_CANCELLED', 'AUTH_OTP');

-- CreateEnum
CREATE TYPE "ScheduledNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_staff_member_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_businessId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_business_id_fkey";

-- DropIndex
DROP INDEX "notification_logs_businessId_created_at_idx";

-- DropIndex
DROP INDEX "verification_locks_recipient_type_recipient_id_idx";

-- DropIndex
DROP INDEX "verifications_recipient_type_recipient_id_idx";

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "staff_member_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "business_limits" DROP COLUMN "period_month_end",
DROP COLUMN "period_month_start",
ADD COLUMN     "period_month" INTEGER NOT NULL,
ADD COLUMN     "period_year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "notification_logs" DROP COLUMN "businessId",
DROP COLUMN "recipientId",
ADD COLUMN     "business_id" TEXT,
ADD COLUMN     "recipient_id" TEXT,
DROP COLUMN "channel",
ADD COLUMN     "channel" "NotificationChannel" NOT NULL,
DROP COLUMN "layer",
ADD COLUMN     "layer" "NotificationLayer" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "NotificationStatus" NOT NULL;

-- AlterTable
ALTER TABLE "scheduled_notifications" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationType" NOT NULL,
DROP COLUMN "layer",
ADD COLUMN     "layer" "NotificationLayer" NOT NULL;

-- AlterTable
ALTER TABLE "verification_locks" DROP COLUMN "recipient_id",
DROP COLUMN "recipient_type",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "recipient_id",
DROP COLUMN "recipient_type",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "notifications";

-- DropEnum
DROP TYPE "NotificationEvent";

-- DropEnum
DROP TYPE "NotificationRecipientType";

-- CreateIndex
CREATE UNIQUE INDEX "appointments_staff_member_id_start_time_status_key" ON "appointments"("staff_member_id", "start_time", "status");

-- CreateIndex
CREATE INDEX "notification_logs_business_id_created_at_idx" ON "notification_logs"("business_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "scheduled_notifications_user_id_idx" ON "scheduled_notifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_locks_user_id_key" ON "verification_locks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_user_id_key" ON "verifications"("user_id");

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_locks" ADD CONSTRAINT "verification_locks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
