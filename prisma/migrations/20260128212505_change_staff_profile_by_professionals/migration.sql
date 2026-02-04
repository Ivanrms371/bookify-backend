/*
  Warnings:

  - You are about to drop the column `enable_blacklist` on the `business_settings` table. All the data in the column will be lost.
  - The `custom_start_time` column on the `schedule_exceptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `custom_end_time` column on the `schedule_exceptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `staff_member_lifetime_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_member_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `staff_members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_staff_member_id_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_staff_member_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_member_lifetime_stats" DROP CONSTRAINT "staff_member_lifetime_stats_staff_member_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_member_stats" DROP CONSTRAINT "staff_member_stats_staff_member_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_members" DROP CONSTRAINT "staff_members_business_id_fkey";

-- DropForeignKey
ALTER TABLE "staff_members" DROP CONSTRAINT "staff_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "working_hours" DROP CONSTRAINT "working_hours_staff_member_id_fkey";

-- AlterTable
ALTER TABLE "business_settings" DROP COLUMN "enable_blacklist";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "phone_verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "schedule_exceptions" DROP COLUMN "custom_start_time",
ADD COLUMN     "custom_start_time" TIMESTAMP(3),
DROP COLUMN "custom_end_time",
ADD COLUMN     "custom_end_time" TIMESTAMP(3);

-- DropTable
DROP TABLE "staff_member_lifetime_stats";

-- DropTable
DROP TABLE "staff_member_stats";

-- DropTable
DROP TABLE "staff_members";

-- CreateTable
CREATE TABLE "staffs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "max_advanced_days" INTEGER NOT NULL DEFAULT 30,
    "min_advanced_minutes" INTEGER NOT NULL DEFAULT 30,
    "title" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "avatar_public_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_stats" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "appointments_count" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "most_sold_service_id" TEXT,
    "new_customers_count" INTEGER NOT NULL,

    CONSTRAINT "staff_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_lifetime_stats" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_appointments" INTEGER NOT NULL DEFAULT 0,
    "no_show_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "staff_lifetime_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staffs_user_id_key" ON "staffs"("user_id");

-- CreateIndex
CREATE INDEX "staffs_business_id_idx" ON "staffs"("business_id");

-- CreateIndex
CREATE INDEX "staff_stats_date_staff_member_id_idx" ON "staff_stats"("date", "staff_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_stats_staff_member_id_date_key" ON "staff_stats"("staff_member_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_lifetime_stats_staff_member_id_key" ON "staff_lifetime_stats"("staff_member_id");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staffs" ADD CONSTRAINT "staffs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_stats" ADD CONSTRAINT "staff_stats_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_lifetime_stats" ADD CONSTRAINT "staff_lifetime_stats_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
