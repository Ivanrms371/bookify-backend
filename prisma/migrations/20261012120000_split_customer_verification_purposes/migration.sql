-- Keep successful contact timestamps; historical verification implies no WhatsApp consent.
ALTER TABLE "customers" ADD COLUMN "whatsapp_opt_in_at" TIMESTAMP(3);
ALTER TABLE "verifications" ADD COLUMN "contact_was_missing" BOOLEAN NOT NULL DEFAULT false;
ALTER TYPE "VerificationType" RENAME TO "VerificationType_old";
CREATE TYPE "VerificationType" AS ENUM ('USER_EMAIL_VERIFICATION', 'USER_PHONE_VERIFICATION', 'PASSWORD_RESET', 'CUSTOMER_VERIFICATION_EMAIL', 'CUSTOMER_VERIFICATION_PHONE');
-- Unknown legacy purposes are expired rather than remaining usable.
UPDATE "verifications" SET "locked_at" = CURRENT_TIMESTAMP, "expires_at" = CURRENT_TIMESTAMP
WHERE "type"::text = 'CUSTOMER_VERIFICATION' AND "verified_at" IS NULL AND ("channel" IS NULL OR "channel"::text NOT IN ('EMAIL', 'WHATSAPP') OR "destination" IS NULL);
ALTER TABLE "verifications" ALTER COLUMN "type" TYPE "VerificationType" USING (
 CASE WHEN "type"::text = 'CUSTOMER_VERIFICATION' THEN
  CASE WHEN "channel"::text = 'WHATSAPP' THEN 'CUSTOMER_VERIFICATION_PHONE' ELSE 'CUSTOMER_VERIFICATION_EMAIL' END
 ELSE "type"::text END
)::"VerificationType";
DROP TYPE "VerificationType_old";
