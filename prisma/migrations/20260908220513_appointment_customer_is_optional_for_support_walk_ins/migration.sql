-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_customer_id_fkey";

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "customer_id" DROP NOT NULL,
ALTER COLUMN "customer_name" DROP NOT NULL,
ALTER COLUMN "customer_phone" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
