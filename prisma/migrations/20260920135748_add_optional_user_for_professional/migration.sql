/*
  Warnings:

  - You are about to drop the column `commission_amount` on the `professionals` table. All the data in the column will be lost.
  - You are about to drop the column `commission_type` on the `professionals` table. All the data in the column will be lost.
  - You are about to drop the column `display_name` on the `professionals` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "professionals" DROP CONSTRAINT "professionals_user_id_fkey";

-- AlterTable
ALTER TABLE "professionals" DROP COLUMN "commission_amount",
DROP COLUMN "commission_type",
DROP COLUMN "display_name",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
