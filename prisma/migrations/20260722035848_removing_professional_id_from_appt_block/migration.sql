/*
  Warnings:

  - You are about to drop the column `professional_id` on the `appointment_blocks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "appointment_blocks_professional_id_starts_at_idx";

-- AlterTable
ALTER TABLE "appointment_blocks" DROP COLUMN "professional_id";
