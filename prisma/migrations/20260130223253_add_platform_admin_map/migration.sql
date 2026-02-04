/*
  Warnings:

  - You are about to drop the `PlatformAdmin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlatformAdmin" DROP CONSTRAINT "PlatformAdmin_user_id_fkey";

-- DropTable
DROP TABLE "PlatformAdmin";

-- CreateTable
CREATE TABLE "platform_admins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" "PlatformAdminLevel" NOT NULL,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_user_id_key" ON "platform_admins"("user_id");

-- CreateIndex
CREATE INDEX "platform_admins_user_id_idx" ON "platform_admins"("user_id");

-- AddForeignKey
ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
