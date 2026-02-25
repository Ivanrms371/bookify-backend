-- CreateIndex
CREATE INDEX "appointment_blocks_appointment_id_idx" ON "appointment_blocks"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_blocks_staff_id_start_time_idx" ON "appointment_blocks"("staff_id", "start_time");
