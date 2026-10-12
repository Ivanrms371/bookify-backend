ALTER TABLE "notifications" ADD COLUMN "occurrence_key" TEXT, ADD COLUMN "expires_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "notifications_occurrence_key_key" ON "notifications"("occurrence_key");
