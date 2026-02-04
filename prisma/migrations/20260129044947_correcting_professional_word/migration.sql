/*
  Warnings:

  - The primary key for the `service_assigments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `profesional_id` on the `service_assigments` table. All the data in the column will be lost.
  - Added the required column `staff_id` to the `service_assigments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "service_assigments" DROP CONSTRAINT "service_assigments_profesional_id_fkey";

-- DropIndex
DROP INDEX "service_assigments_profesional_id_is_active_idx";

-- AlterTable
ALTER TABLE "service_assigments" DROP CONSTRAINT "service_assigments_pkey",
DROP COLUMN "profesional_id",
ADD COLUMN     "staff_id" TEXT NOT NULL,
ADD CONSTRAINT "service_assigments_pkey" PRIMARY KEY ("staff_id", "service_id");

-- CreateIndex
CREATE INDEX "service_assigments_staff_id_is_active_idx" ON "service_assigments"("staff_id", "is_active");

-- AddForeignKey
ALTER TABLE "service_assigments" ADD CONSTRAINT "service_assigments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
