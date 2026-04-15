/*
  Warnings:

  - You are about to drop the column `previous_end_time` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `previous_start_time` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `no_show_count` on the `staff_lifetime_stats` table. All the data in the column will be lost.
  - You are about to drop the column `appointments_count` on the `staff_stats` table. All the data in the column will be lost.
  - You are about to drop the column `most_sold_service_id` on the `staff_stats` table. All the data in the column will be lost.
  - You are about to drop the column `new_customers_count` on the `staff_stats` table. All the data in the column will be lost.
  - You are about to drop the column `customers` on the `tenant_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `cancellation_rate` on the `tenant_lifetime_stats` table. All the data in the column will be lost.
  - You are about to drop the column `no_show_rate` on the `tenant_lifetime_stats` table. All the data in the column will be lost.
  - Added the required column `scheduled_date` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_customers` to the `staff_stats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING';

-- DropIndex
DROP INDEX "staff_stats_date_staff_member_id_idx";

-- DropIndex
DROP INDEX "tenant_daily_stats_tenant_id_date_idx";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "previous_end_time",
DROP COLUMN "previous_start_time",
ADD COLUMN     "scheduled_date" DATE NOT NULL;

-- AlterTable
ALTER TABLE "staff_lifetime_stats" DROP COLUMN "no_show_count",
ADD COLUMN     "total_cancelled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_new_customers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_no_show" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "staff_stats" DROP COLUMN "appointments_count",
DROP COLUMN "most_sold_service_id",
DROP COLUMN "new_customers_count",
ADD COLUMN     "appointments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancelled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "new_customers" INTEGER NOT NULL,
ADD COLUMN     "no_show" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenant_daily_stats" DROP COLUMN "customers",
ADD COLUMN     "new_customers" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenant_lifetime_stats" DROP COLUMN "cancellation_rate",
DROP COLUMN "no_show_rate",
ADD COLUMN     "total_cancelled" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_no_show" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "total_revenue" SET DATA TYPE DECIMAL(12,2);

-- DropEnum
DROP TYPE "NotificationType";
