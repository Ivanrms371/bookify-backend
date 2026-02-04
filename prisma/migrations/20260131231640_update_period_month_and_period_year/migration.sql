/*
  Warnings:

  - Changed the type of `period_month_start` on the `business_limits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `period_month_end` on the `business_limits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "business_limits" DROP COLUMN "period_month_start",
ADD COLUMN     "period_month_start" INTEGER NOT NULL,
DROP COLUMN "period_month_end",
ADD COLUMN     "period_month_end" INTEGER NOT NULL;
