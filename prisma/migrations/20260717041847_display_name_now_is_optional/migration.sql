/*
  Warnings:

  - You are about to drop the column `title` on the `professionals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "professionals" DROP COLUMN "title",
ALTER COLUMN "display_name" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "memberships_tenant_id_idx" ON "memberships"("tenant_id");
