/*
  Warnings:

  - You are about to drop the column `max_advanced_days` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `min_advanced_minutes` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `slot_interval_minutes` on the `invitations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "max_advanced_days",
DROP COLUMN "min_advanced_minutes",
DROP COLUMN "slot_interval_minutes";
