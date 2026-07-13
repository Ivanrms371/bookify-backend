/*
  Warnings:

  - The values [FINALIZING] on the enum `OnboardingStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OnboardingStatus_new" AS ENUM ('WORKSPACE_TYPE', 'BUSINESS_DETAILS', 'SCHEDULE', 'SERVICES', 'TEAM_INVITE', 'CUSTOMIZE', 'CONFIRM', 'COMPLETED');
ALTER TABLE "public"."tenants" ALTER COLUMN "onboarding_status" DROP DEFAULT;
ALTER TABLE "tenants" ALTER COLUMN "onboarding_status" TYPE "OnboardingStatus_new" USING ("onboarding_status"::text::"OnboardingStatus_new");
ALTER TYPE "OnboardingStatus" RENAME TO "OnboardingStatus_old";
ALTER TYPE "OnboardingStatus_new" RENAME TO "OnboardingStatus";
DROP TYPE "public"."OnboardingStatus_old";
ALTER TABLE "tenants" ALTER COLUMN "onboarding_status" SET DEFAULT 'WORKSPACE_TYPE';
COMMIT;
