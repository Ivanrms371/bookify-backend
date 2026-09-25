/*
  Warnings:

  - Made the column `email` on table `professionals` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone_country_code` on table `professionals` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone_number` on table `professionals` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "professionals" ADD COLUMN     "profession" TEXT,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone_country_code" SET NOT NULL,
ALTER COLUMN "phone_number" SET NOT NULL;

-- AlterTable
ALTER TABLE "verifications" ADD COLUMN     "tenantId" UUID;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
