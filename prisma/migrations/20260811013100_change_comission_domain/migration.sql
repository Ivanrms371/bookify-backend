/*
  Warnings:

  - You are about to drop the column `commission_amout` on the `invitations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "commission_amout",
ADD COLUMN     "commission_amount" DECIMAL(65,30);
