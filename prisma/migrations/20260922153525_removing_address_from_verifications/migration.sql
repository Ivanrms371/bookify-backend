/*
  Warnings:

  - You are about to drop the column `address` on the `verifications` table. All the data in the column will be lost.
  - Added the required column `recipient_id` to the `verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipient_type` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "verifications_address_type_idx";

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "address",
ADD COLUMN     "recipient_id" UUID NOT NULL,
ADD COLUMN     "recipient_type" "RecipientType" NOT NULL;

-- CreateIndex
CREATE INDEX "verifications_recipient_id_recipient_type_type_idx" ON "verifications"("recipient_id", "recipient_type", "type");
