/*
  Warnings:

  - You are about to drop the column `appointment_limit` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `email_limit` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `professional_limit` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_limit` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the `tenant_quotas` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('WORKSPACE_TYPE', 'BUSINESS_DETAILS', 'SCHEDULE', 'SERVICES', 'TEAM_INVITE', 'CUSTOMIZE', 'FINALIZING', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "tenant_quotas" DROP CONSTRAINT "tenant_quotas_tenant_id_fkey";

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "appointment_limit",
DROP COLUMN "email_limit",
DROP COLUMN "is_active",
DROP COLUMN "professional_limit",
DROP COLUMN "whatsapp_limit",
ADD COLUMN     "appointment_quota" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "email_quota" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "employee_limit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "whatsapp_quota" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'WORKSPACE_TYPE';

-- DropTable
DROP TABLE "tenant_quotas";

-- CreateTable
CREATE TABLE "tenant_usages" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "tenant_id" UUID NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "last_reset_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "appointment_count" INTEGER NOT NULL DEFAULT 0,
    "appointment_limit" INTEGER NOT NULL DEFAULT -1,
    "whatsapp_count" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_limit" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_cost" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "email_count" INTEGER NOT NULL DEFAULT 0,
    "email_limit" INTEGER NOT NULL DEFAULT 0,
    "email_cost" DECIMAL(6,4) NOT NULL DEFAULT 0,

    CONSTRAINT "tenant_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_usages_tenant_id_idx" ON "tenant_usages"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_usages" ADD CONSTRAINT "tenant_usages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
