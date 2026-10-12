ALTER TABLE "notification_deliveries" ADD COLUMN "claimed_at" TIMESTAMP(3);
CREATE TABLE "notification_usage_reservations" (
  "delivery_id" UUID PRIMARY KEY REFERENCES "notification_deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "usage_id" UUID NOT NULL REFERENCES "tenant_usages"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "channel" "NotificationChannel" NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'RESERVED',
  "ambiguous" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "notification_reservation_state" CHECK ("state" IN ('RESERVED', 'CONFIRMED', 'RELEASED')),
  CONSTRAINT "notification_reservation_channel" CHECK ("channel" IN ('EMAIL', 'WHATSAPP'))
);
CREATE INDEX "notification_usage_reservations_usage_id_idx" ON "notification_usage_reservations"("usage_id");
