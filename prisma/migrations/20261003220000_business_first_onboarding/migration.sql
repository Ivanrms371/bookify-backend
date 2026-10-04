-- Additive enum value; old values remain valid for legacy clients.
ALTER TYPE "OnboardingStatus" ADD VALUE 'PROFESSIONAL_PROFILE';
ALTER TABLE "tenants" ADD COLUMN "onboarding_professional_draft" JSONB;
ALTER TABLE "tenants" ALTER COLUMN "onboarding_status" SET DEFAULT 'BUSINESS_DETAILS';
-- Existing unfinished accounts review their saved setup in the new order.
UPDATE "tenants" SET "onboarding_status" = 'BUSINESS_DETAILS'
WHERE "onboarding_status" <> 'COMPLETED' AND "deleted_at" IS NULL;
