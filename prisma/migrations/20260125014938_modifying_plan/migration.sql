-- AlterTable
ALTER TABLE "plans" ALTER COLUMN "billing_cycle" DROP NOT NULL,
ALTER COLUMN "billing_cycle" DROP DEFAULT;
