-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "phone_country_code" TEXT NOT NULL DEFAULT '598';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_country_code" TEXT NOT NULL DEFAULT '598';
