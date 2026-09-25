/*
  Warnings:

  - You are about to drop the column `accepts_email` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `accepts_whatsapp` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `email_bounced` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `phone_verified` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_language` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "accepts_email",
DROP COLUMN "accepts_whatsapp",
DROP COLUMN "email_bounced",
DROP COLUMN "email_verified",
DROP COLUMN "notes",
DROP COLUMN "phone_verified",
DROP COLUMN "preferred_language",
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "phone_verified_at" TIMESTAMP(3);
