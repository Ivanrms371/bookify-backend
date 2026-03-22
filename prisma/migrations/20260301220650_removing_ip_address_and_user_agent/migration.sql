/*
  Warnings:

  - You are about to drop the column `ip_address` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `ip_address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "ip_address",
DROP COLUMN "user_agent";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "ip_address",
DROP COLUMN "user_agent",
ADD COLUMN     "pending_plan" "PlanType";
