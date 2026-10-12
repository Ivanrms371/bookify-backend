ALTER TABLE "subscriptions"
  ADD COLUMN "next_renewal_at" TIMESTAMP(3),
  ADD COLUMN "renewal_checked_at" TIMESTAMP(3),
  ADD COLUMN "renewal_check_attempted_at" TIMESTAMP(3);

CREATE INDEX "subscriptions_status_next_renewal_at_idx" ON "subscriptions"("status", "next_renewal_at");
