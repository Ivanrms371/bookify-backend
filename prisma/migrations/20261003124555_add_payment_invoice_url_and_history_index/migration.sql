-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "invoice_url" TEXT;

-- CreateIndex
CREATE INDEX "payments_tenant_id_issued_at_id_idx" ON "payments"("tenant_id", "issued_at", "id");
