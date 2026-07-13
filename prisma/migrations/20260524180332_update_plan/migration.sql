/*
  Warnings:

  - You are about to drop the column `appointment_quota` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `email_quota` on the `plans` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp_quota` on the `plans` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "appointment_quota",
DROP COLUMN "email_quota",
DROP COLUMN "whatsapp_quota",
ADD COLUMN     "appointment_limit" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "email_limit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whatsapp_limit" INTEGER NOT NULL DEFAULT 0;
