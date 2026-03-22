/*
  Warnings:

  - You are about to drop the column `onboarding_completed` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `onboarding_step` on the `businesses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "onboarding_completed",
DROP COLUMN "onboarding_step";

-- AlterTable
ALTER TABLE "member_invites" ALTER COLUMN "role" SET DEFAULT 'OWNER';

-- CreateTable
CREATE TABLE "business_onboarding" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "business_id" UUID NOT NULL,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "has_service" BOOLEAN NOT NULL DEFAULT false,
    "has_schedule" BOOLEAN NOT NULL DEFAULT false,
    "has_staff" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_onboarding_business_id_key" ON "business_onboarding"("business_id");

-- AddForeignKey
ALTER TABLE "business_onboarding" ADD CONSTRAINT "business_onboarding_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
