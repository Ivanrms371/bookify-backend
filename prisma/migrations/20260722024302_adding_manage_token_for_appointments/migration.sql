/*
  Warnings:

  - You are about to drop the column `cancel_token` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `confirmation_code` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `reschedule_requested_at` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `reschedule_token` on the `appointments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[manage_token]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "appointments_cancel_token_key";

-- DropIndex
DROP INDEX "appointments_reschedule_token_key";

-- DropIndex
DROP INDEX "appointments_tenant_id_confirmation_code_key";

-- DropIndex
DROP INDEX "customers_email_idx";

-- DropIndex
DROP INDEX "customers_email_trgm_idx";

-- DropIndex
DROP INDEX "customers_name_trgm_idx";

-- DropIndex
DROP INDEX "customers_phone_trgm_idx";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "cancel_token",
DROP COLUMN "confirmation_code",
DROP COLUMN "reschedule_requested_at",
DROP COLUMN "reschedule_token",
ADD COLUMN     "manage_token" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "appointments_manage_token_key" ON "appointments"("manage_token");
