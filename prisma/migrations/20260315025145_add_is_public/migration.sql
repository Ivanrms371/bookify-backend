-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT false;
