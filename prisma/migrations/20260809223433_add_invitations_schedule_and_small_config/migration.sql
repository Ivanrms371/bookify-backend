-- AlterTable
ALTER TABLE "invitations" ADD COLUMN     "max_advanced_days" INTEGER,
ADD COLUMN     "min_advanced_minutes" INTEGER,
ADD COLUMN     "schedule" JSONB,
ADD COLUMN     "slot_interval_minutes" INTEGER;
