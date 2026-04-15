/*
  Warnings:

  - You are about to drop the `member_invites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "member_invites" DROP CONSTRAINT "member_invites_inviter_id_fkey";

-- DropForeignKey
ALTER TABLE "member_invites" DROP CONSTRAINT "member_invites_tenant_id_fkey";

-- DropIndex
DROP INDEX "tenants_owner_id_key";

-- DropTable
DROP TABLE "member_invites";
