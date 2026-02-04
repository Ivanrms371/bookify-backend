-- AlterTable
ALTER TABLE "notification_logs" ALTER COLUMN "scheduled_notification_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_scheduled_notification_id_fkey" FOREIGN KEY ("scheduled_notification_id") REFERENCES "scheduled_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
