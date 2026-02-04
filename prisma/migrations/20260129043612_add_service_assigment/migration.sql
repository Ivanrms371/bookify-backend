/*
  Warnings:

  - You are about to drop the column `staff_member_id` on the `services` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_service_id_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_staff_member_id_fkey";

-- DropIndex
DROP INDEX "services_staff_member_id_idx";

-- AlterTable
ALTER TABLE "services" DROP COLUMN "staff_member_id",
ADD COLUMN     "discount_fixed" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "discount_percentage" DECIMAL(65,30) DEFAULT 0;

-- CreateTable
CREATE TABLE "service_assigments" (
    "profesional_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "customPrice" DECIMAL(10,2) NOT NULL,
    "custom_discount_percentage" DECIMAL(65,30) DEFAULT 0,
    "custom_discount_fixed" DECIMAL(10,2) DEFAULT 0,
    "custom_duration_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_assigments_pkey" PRIMARY KEY ("profesional_id","service_id")
);

-- CreateIndex
CREATE INDEX "service_assigments_profesional_id_is_active_idx" ON "service_assigments"("profesional_id", "is_active");

-- AddForeignKey
ALTER TABLE "service_assigments" ADD CONSTRAINT "service_assigments_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assigments" ADD CONSTRAINT "service_assigments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
