/*
  Warnings:

  - You are about to drop the column `next_appointment_at` on the `customers` table. All the data in the column will be lost.
  - You are about to alter the column `total_spent` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "next_appointment_at",
ALTER COLUMN "total_spent" SET DATA TYPE DECIMAL(65,30);
