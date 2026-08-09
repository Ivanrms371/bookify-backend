/*
  Warnings:

  - You are about to drop the column `comisionType` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `commissionValue` on the `invitations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "comisionType",
DROP COLUMN "commissionValue",
ADD COLUMN     "comision_type" "CommissionType",
ADD COLUMN     "comision_value" DECIMAL(65,30);
