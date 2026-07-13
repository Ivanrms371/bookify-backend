/*
  Warnings:

  - You are about to drop the column `onboarding_completed` on the `tenants` table. All the data in the column will be lost.
  - Added the required column `workspace_type` to the `tenants` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('INDEPENDENT', 'MULTI_STAFF');

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "onboarding_completed",
ADD COLUMN     "workspace_type" "WorkspaceType" NOT NULL;
