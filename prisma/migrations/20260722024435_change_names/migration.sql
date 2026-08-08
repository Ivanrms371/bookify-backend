/*
  Warnings:

  - You are about to drop the column `end_time` on the `appointment_blocks` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `appointment_blocks` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `appointments` table. All the data in the column will be lost.
  - Added the required column `ends_at` to the `appointment_blocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `starts_at` to the `appointment_blocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ends_at` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `starts_at` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "appointment_blocks_professional_id_start_time_idx";

-- DropIndex
DROP INDEX "appointments_tenant_id_professional_id_start_time_end_time_idx";

-- DropIndex
DROP INDEX "appointments_tenant_id_status_start_time_idx";

-- AlterTable
ALTER TABLE "appointment_blocks" DROP COLUMN "end_time",
DROP COLUMN "start_time",
ADD COLUMN     "ends_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "starts_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "end_time",
DROP COLUMN "start_time",
ADD COLUMN     "ends_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "starts_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "appointment_blocks_professional_id_starts_at_idx" ON "appointment_blocks"("professional_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_status_starts_at_idx" ON "appointments"("tenant_id", "status", "starts_at");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_professional_id_starts_at_ends_at_idx" ON "appointments"("tenant_id", "professional_id", "starts_at", "ends_at");
