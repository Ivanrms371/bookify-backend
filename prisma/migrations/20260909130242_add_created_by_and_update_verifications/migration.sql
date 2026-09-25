/*
  Warnings:

  - The values [APPOINTMENT,EMAIL_CONFIRM,PHONE_CONFIRM,MAGIC_LINK,AUTH_CODE] on the enum `VerificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `user_id` on the `verifications` table. All the data in the column will be lost.
  - You are about to drop the `verification_locks` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CreatedByType" AS ENUM ('CUSTOMER', 'STAFF');

-- AlterEnum
BEGIN;
CREATE TYPE "VerificationType_new" AS ENUM ('CUSTOMER_PHONE_VERIFICATION', 'CUSTOMER_EMAIL_VERIFICATION', 'USER_EMAIL_VERIFICATION', 'USER_PHONE_VERIFICATION', 'PASSWORD_RESET');
ALTER TABLE "verifications" ALTER COLUMN "type" TYPE "VerificationType_new" USING ("type"::text::"VerificationType_new");
ALTER TYPE "VerificationType" RENAME TO "VerificationType_old";
ALTER TYPE "VerificationType_new" RENAME TO "VerificationType";
DROP TYPE "public"."VerificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "verification_locks" DROP CONSTRAINT "verification_locks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "verifications" DROP CONSTRAINT "verifications_user_id_fkey";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "created_by" "CreatedByType" DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "user_id";

-- DropTable
DROP TABLE "verification_locks";
