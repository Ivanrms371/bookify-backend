/*
  Warnings:

  - Made the column `created_by` on table `appointments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "created_by" SET NOT NULL;
