-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_notification_id_fkey";

-- AlterTable
ALTER TABLE "notification_logs" ALTER COLUMN "notification_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notification_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
