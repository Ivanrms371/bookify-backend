/*
  Warnings:

  - A unique constraint covering the columns `[reschedule_token]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cancel_token]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "cancel_token" TEXT,
ADD COLUMN     "previous_end_time" TIMESTAMP(3),
ADD COLUMN     "previous_start_time" TIMESTAMP(3),
ADD COLUMN     "reschedule_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reschedule_reason" TEXT,
ADD COLUMN     "reschedule_requested_at" TIMESTAMP(3),
ADD COLUMN     "reschedule_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_reschedule_token_key" ON "appointments"("reschedule_token");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_cancel_token_key" ON "appointments"("cancel_token");
