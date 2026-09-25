-- DropIndex
DROP INDEX "verifications_address_idx";

-- DropEnum
DROP TYPE "MembershipStatus";

-- DropEnum
DROP TYPE "PlanType";

-- CreateIndex
CREATE INDEX "verifications_address_type_idx" ON "verifications"("address", "type");
