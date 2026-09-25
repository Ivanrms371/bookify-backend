/*
  Warnings:

  - You are about to drop the column `created_at` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `memberships` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "created_at",
DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "role" DROP DEFAULT;
