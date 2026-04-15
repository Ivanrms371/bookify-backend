/*
  Warnings:

  - You are about to drop the column `internal_notes` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant_id,staff_member_id]` on the table `staff_lifetime_stats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenant_id` to the `staff_lifetime_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant_id` to the `staff_stats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "internal_notes";

-- AlterTable
ALTER TABLE "staff_lifetime_stats" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "staff_stats" ADD COLUMN     "tenant_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "staff_lifetime_stats_tenant_id_idx" ON "staff_lifetime_stats"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_lifetime_stats_tenant_id_staff_member_id_key" ON "staff_lifetime_stats"("tenant_id", "staff_member_id");

-- CreateIndex
CREATE INDEX "staff_stats_tenant_id_date_idx" ON "staff_stats"("tenant_id", "date");

-- AddForeignKey
ALTER TABLE "staff_stats" ADD CONSTRAINT "staff_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_lifetime_stats" ADD CONSTRAINT "staff_lifetime_stats_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
