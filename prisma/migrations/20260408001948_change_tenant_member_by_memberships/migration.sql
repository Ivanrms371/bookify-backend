-- DropIndex
DROP INDEX "appointments_start_time_status_idx";

-- DropIndex
DROP INDEX "appointments_tenant_id_status_idx";

-- CreateIndex
CREATE INDEX "appointments_tenant_id_status_start_time_idx" ON "appointments"("tenant_id", "status", "start_time");
