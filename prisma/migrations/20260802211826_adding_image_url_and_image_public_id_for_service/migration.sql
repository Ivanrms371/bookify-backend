/*
  Warnings:

  - You are about to drop the column `image` on the `services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "services" DROP COLUMN "image",
ADD COLUMN     "image_public_id" TEXT,
ADD COLUMN     "image_url" TEXT;
