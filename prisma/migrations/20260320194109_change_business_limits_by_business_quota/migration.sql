/*
  Warnings:

  - You are about to drop the `business_limits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "business_limits" DROP CONSTRAINT "business_limits_business_id_fkey";

-- DropTable
DROP TABLE "business_limits";

-- CreateTable
CREATE TABLE "business_quotas" (
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

    CONSTRAINT "business_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_quotas_business_id_key" ON "business_quotas"("business_id");

-- CreateIndex
CREATE INDEX "business_quotas_business_id_idx" ON "business_quotas"("business_id");

-- AddForeignKey
ALTER TABLE "business_quotas" ADD CONSTRAINT "business_quotas_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
