/*
  Warnings:

  - You are about to drop the column `commission_amount` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `commission_type` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `phone_country_code` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `schedule` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `service_ids` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `display_order` on the `professionals` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `professionals` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `professionals` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "professionals" DROP CONSTRAINT "professionals_id_fkey";

-- DropIndex
DROP INDEX "professionals_user_id_tenant_id_key";

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "commission_amount",
DROP COLUMN "commission_type",
DROP COLUMN "phoneNumber",
DROP COLUMN "phone_country_code",
DROP COLUMN "schedule",
DROP COLUMN "service_ids",
DROP COLUMN "status",
ADD COLUMN     "accepted_at" TIMESTAMP(3),
ADD COLUMN     "professional_id" UUID,
ADD COLUMN     "revoked_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "professionals" DROP COLUMN "display_order",
ADD COLUMN     "phone_country_code" TEXT,
ADD COLUMN     "phone_number" TEXT,
ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE INDEX "invitations_professional_id_idx" ON "invitations"("professional_id");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_user_id_key" ON "professionals"("user_id");

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
