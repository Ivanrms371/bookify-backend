/*
  Warnings:

  - You are about to drop the column `reference_id` on the `notification_deliveries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notification_deliveries" DROP COLUMN "reference_id",
ADD COLUMN     "external_reference_id" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "reference_id" TEXT;

-- CreateIndex
CREATE INDEX "notifications_reference_id_idx" ON "notifications"("reference_id");
