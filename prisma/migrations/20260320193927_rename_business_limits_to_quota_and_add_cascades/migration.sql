-- DropForeignKey
ALTER TABLE "business_daily_stats" DROP CONSTRAINT "business_daily_stats_business_id_fkey";

-- DropForeignKey
ALTER TABLE "business_lifetime_stats" DROP CONSTRAINT "business_lifetime_stats_business_id_fkey";

-- DropForeignKey
ALTER TABLE "business_onboarding" DROP CONSTRAINT "business_onboarding_business_id_fkey";

-- DropForeignKey
ALTER TABLE "business_settings" DROP CONSTRAINT "business_settings_business_id_fkey";

-- AlterTable
ALTER TABLE "working_hours" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "business_working_hours" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_minutes" INTEGER NOT NULL,
    "start_minutes" INTEGER NOT NULL,

    CONSTRAINT "business_working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_working_hours_business_id_day_of_week_idx" ON "business_working_hours"("business_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_working_hours" ADD CONSTRAINT "business_working_hours_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_daily_stats" ADD CONSTRAINT "business_daily_stats_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_lifetime_stats" ADD CONSTRAINT "business_lifetime_stats_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_onboarding" ADD CONSTRAINT "business_onboarding_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
