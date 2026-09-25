/*
  Warnings:

  - You are about to drop the column `discount_amount` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `discount_expires_at` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `discount_type` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `next_payment_date` on the `subscriptions` table. All the data in the column will be lost.
  - The `currency` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "discount_amount",
DROP COLUMN "discount_expires_at",
DROP COLUMN "discount_type",
DROP COLUMN "next_payment_date",
ADD COLUMN     "ends_at" TIMESTAMP(3),
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';

-- CreateIndex
CREATE INDEX "subscriptions_lemon_customer_id_idx" ON "subscriptions"("lemon_customer_id");
