/*
  Warnings:

  - You are about to drop the column `commission_fixed` on the `professionals` table. All the data in the column will be lost.
  - You are about to drop the column `commission_percent` on the `professionals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "professionals" DROP COLUMN "commission_fixed",
DROP COLUMN "commission_percent",
ADD COLUMN     "commission_amount" DECIMAL(10,2) DEFAULT 0;
