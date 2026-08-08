/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,phone_country_code,phone]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenant_id,email]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "customers_last_appointment_at_idx";

-- DropIndex
DROP INDEX "customers_tenant_id_phone_key";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "phone_country_code" SET DEFAULT '598';

-- CreateIndex
CREATE INDEX "customers_tenant_id_last_appointment_at_idx" ON "customers"("tenant_id", "last_appointment_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_blocked_at_idx" ON "customers"("tenant_id", "blocked_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_deleted_at_idx" ON "customers"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_phone_country_code_phone_key" ON "customers"("tenant_id", "phone_country_code", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_email_key" ON "customers"("tenant_id", "email");
