/*
  Warnings:

  - The values [PROFESSIONAL] on the enum `MembershipRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `name` on the `invitations` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MembershipRole_new" AS ENUM ('OWNER', 'ADMIN', 'STAFF');
ALTER TABLE "public"."invitations" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."memberships" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "memberships" ALTER COLUMN "role" TYPE "MembershipRole_new" USING ("role"::text::"MembershipRole_new");
ALTER TABLE "invitations" ALTER COLUMN "role" TYPE "MembershipRole_new" USING ("role"::text::"MembershipRole_new");
ALTER TYPE "MembershipRole" RENAME TO "MembershipRole_old";
ALTER TYPE "MembershipRole_new" RENAME TO "MembershipRole";
DROP TYPE "public"."MembershipRole_old";
ALTER TABLE "invitations" ALTER COLUMN "role" SET DEFAULT 'STAFF';
ALTER TABLE "memberships" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
COMMIT;

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "name",
ALTER COLUMN "role" SET DEFAULT 'STAFF';
