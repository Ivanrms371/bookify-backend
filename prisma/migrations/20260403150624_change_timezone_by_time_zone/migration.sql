/*
  Warnings:

  - You are about to drop the column `timezone` on the `tenant_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tenant_settings" DROP COLUMN "timezone",
ADD COLUMN     "time_zone" TEXT NOT NULL DEFAULT 'America/Montevideo';
