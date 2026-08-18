/*
  Warnings:

  - You are about to drop the column `comision_type` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `comision_value` on the `invitations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "comision_type",
DROP COLUMN "comision_value",
ADD COLUMN     "commission_amout" DECIMAL(65,30),
ADD COLUMN     "commission_type" "CommissionType";
