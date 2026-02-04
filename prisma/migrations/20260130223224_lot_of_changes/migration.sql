/*
  Warnings:

  - You are about to drop the column `addressLine1` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `addressLine2` on the `businesses` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `email_verified_at` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `phone_verified_at` on the `customers` table. All the data in the column will be lost.
  - The `role` column on the `member_invites` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `channelPreference` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerifiedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tokenVersion` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[business_id,user_id]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'ADMIN', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "PlatformAdminLevel" AS ENUM ('GOD', 'MODERATOR', 'SUPPORTY');

-- DropIndex
DROP INDEX "customers_business_id_phone_idx";

-- DropIndex
DROP INDEX "customers_business_id_phone_key";

-- DropIndex
DROP INDEX "users_googleId_key";

-- AlterTable
ALTER TABLE "businesses" DROP COLUMN "addressLine1",
DROP COLUMN "addressLine2",
ADD COLUMN     "address_line_1" TEXT,
ADD COLUMN     "address_line_2" TEXT;

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "email",
DROP COLUMN "email_verified_at",
DROP COLUMN "name",
DROP COLUMN "phone",
DROP COLUMN "phone_verified_at",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "member_invites" DROP COLUMN "role",
ADD COLUMN     "role" "StaffRole" NOT NULL DEFAULT 'PROFESSIONAL';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "channelPreference",
DROP COLUMN "createdAt",
DROP COLUMN "emailVerifiedAt",
DROP COLUMN "googleId",
DROP COLUMN "lastLoginAt",
DROP COLUMN "provider",
DROP COLUMN "role",
DROP COLUMN "tokenVersion",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email_verified_at" TIMESTAMP(3),
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "phone_verified_at" TIMESTAMP(3),
ADD COLUMN     "token_version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "level" "PlatformAdminLevel" NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_user_id_key" ON "PlatformAdmin"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_business_id_user_id_key" ON "customers"("business_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAdmin" ADD CONSTRAINT "PlatformAdmin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
