-- Add a persisted address step. Existing completed tenants are unchanged.
ALTER TYPE "OnboardingStatus" ADD VALUE 'LOCATION';

-- Owners who advanced without a supported complete address review the new step.
-- Preserve all draft fields; BUSINESS_DETAILS already exists in this transaction.
UPDATE "tenants" SET "onboarding_status" = 'BUSINESS_DETAILS'
WHERE "onboarding_status" NOT IN ('COMPLETED', 'BUSINESS_DETAILS') AND "deleted_at" IS NULL
  AND (
    COALESCE("country", '') NOT IN ('UY', 'AR', 'PE', 'CL', 'PY')
    OR NULLIF(TRIM("province"), '') IS NULL
    OR NULLIF(TRIM("city"), '') IS NULL
    OR NULLIF(TRIM("address_line_1"), '') IS NULL
  );
