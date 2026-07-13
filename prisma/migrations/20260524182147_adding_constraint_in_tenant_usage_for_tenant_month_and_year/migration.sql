/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,period_month,period_year]` on the table `tenant_usages` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "tenant_usages_tenant_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "tenant_usages_tenant_id_period_month_period_year_key" ON "tenant_usages"("tenant_id", "period_month", "period_year");
