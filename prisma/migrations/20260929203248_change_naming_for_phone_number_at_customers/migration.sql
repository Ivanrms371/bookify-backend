/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant_id,phone_country_code,phone_number]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone_number` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "customers_tenant_id_phone_country_code_phoneNumber_key";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "phoneNumber",
ADD COLUMN     "phone_number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_phone_country_code_phone_number_key" ON "customers"("tenant_id", "phone_country_code", "phone_number");
