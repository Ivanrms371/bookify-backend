/*
  Warnings:

  - You are about to drop the column `phone_country_code` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneCountryCode,phoneNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_phone_country_code_phone_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone_country_code",
ADD COLUMN     "phoneCountryCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneCountryCode_phoneNumber_key" ON "users"("phoneCountryCode", "phoneNumber");

-- RenameIndex
ALTER INDEX "customers_tenant_id_phone_country_code_phone_key" RENAME TO "customers_tenant_id_phone_country_code_phoneNumber_key";
