-- AlterTable
ALTER TABLE "business_settings" ADD COLUMN     "buffer_time_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enable_blacklist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "holiday_closure_auto_apply" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_pending_appts_per_client" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "require_confirmation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "total_cancellations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_no_shows" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0;
