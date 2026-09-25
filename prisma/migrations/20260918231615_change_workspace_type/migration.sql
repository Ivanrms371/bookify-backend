/*
  Warnings:

  - The values [INDEPENDENT,MULTI_STAFF] on the enum `WorkspaceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `discount_percent` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `external_id` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to alter the column `discount_amount` on the `subscriptions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the `plan_stats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `plans` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[lemon_subscription_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterEnum
BEGIN;
CREATE TYPE "WorkspaceType_new" AS ENUM ('INDIVIDUAL', 'TEAM');
ALTER TABLE "tenants" ALTER COLUMN "workspace_type" TYPE "WorkspaceType_new" USING ("workspace_type"::text::"WorkspaceType_new");
ALTER TYPE "WorkspaceType" RENAME TO "WorkspaceType_old";
ALTER TYPE "WorkspaceType_new" RENAME TO "WorkspaceType";
DROP TYPE "public"."WorkspaceType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "plan_stats" DROP CONSTRAINT "plan_stats_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_plan_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "discount_percent",
DROP COLUMN "external_id",
ADD COLUMN     "discount_type" "DiscountType",
ADD COLUMN     "lemon_customer_id" TEXT,
ADD COLUMN     "lemon_subscription_id" TEXT,
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "trial_started_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "discount_amount" DROP NOT NULL,
ALTER COLUMN "discount_amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "payment_provider" SET DEFAULT 'LEMON_SQUEEZY';

-- DropTable
DROP TABLE "plan_stats";

-- DropTable
DROP TABLE "plans";

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_lemon_subscription_id_key" ON "subscriptions"("lemon_subscription_id");
