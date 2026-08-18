/*
  Warnings:

  - You are about to drop the column `professional_id` on the `schedule_exceptions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "schedule_exceptions" DROP CONSTRAINT "schedule_exceptions_professional_id_fkey";

-- DropIndex
DROP INDEX "schedule_exceptions_professional_id_idx";

-- DropIndex
DROP INDEX "schedule_exceptions_professional_id_start_date_end_date_idx";

-- AlterTable
ALTER TABLE "schedule_exceptions" DROP COLUMN "professional_id";

-- AlterTable
ALTER TABLE "tenant_settings" ALTER COLUMN "allow_passive_time_booking" SET DEFAULT false;

-- CreateTable
CREATE TABLE "schedule_exception_professionals" (
    "schedule_exception_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,

    CONSTRAINT "schedule_exception_professionals_pkey" PRIMARY KEY ("schedule_exception_id","professional_id")
);

-- CreateIndex
CREATE INDEX "schedule_exception_professionals_professional_id_idx" ON "schedule_exception_professionals"("professional_id");

-- CreateIndex
CREATE INDEX "schedule_exceptions_start_date_end_date_idx" ON "schedule_exceptions"("start_date", "end_date");

-- AddForeignKey
ALTER TABLE "schedule_exception_professionals" ADD CONSTRAINT "schedule_exception_professionals_schedule_exception_id_fkey" FOREIGN KEY ("schedule_exception_id") REFERENCES "schedule_exceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_exception_professionals" ADD CONSTRAINT "schedule_exception_professionals_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
