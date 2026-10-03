-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "pending_billing_cycle" "BillingCycle",
ADD COLUMN     "pending_plan_id" TEXT,
ADD COLUMN     "plan_changes_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "subscriptions_plan_changes_at_idx" ON "subscriptions"("plan_changes_at");
