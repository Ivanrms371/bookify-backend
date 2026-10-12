-- Replacement for the unapplied public-booking-process proposal. Review only.
ALTER TABLE "verifications" ADD COLUMN "channel" "NotificationChannel", ADD COLUMN "destination" TEXT;
-- Historical challenges have no reliable destination snapshot. Never credit them.
UPDATE "verifications" SET locked_at = CURRENT_TIMESTAMP, expires_at = LEAST(expires_at, CURRENT_TIMESTAMP)
WHERE type::text IN ('CUSTOMER_PHONE_VERIFICATION', 'CUSTOMER_EMAIL_VERIFICATION') AND verified_at IS NULL;
ALTER TYPE "VerificationType" RENAME TO "VerificationType_legacy";
CREATE TYPE "VerificationType" AS ENUM ('CUSTOMER_VERIFICATION', 'USER_EMAIL_VERIFICATION', 'USER_PHONE_VERIFICATION', 'PASSWORD_RESET');
ALTER TABLE "verifications" ALTER COLUMN "type" TYPE "VerificationType" USING
  (CASE WHEN type::text IN ('CUSTOMER_PHONE_VERIFICATION', 'CUSTOMER_EMAIL_VERIFICATION') THEN 'CUSTOMER_VERIFICATION' ELSE type::text END)::"VerificationType";
DROP TYPE "VerificationType_legacy";
