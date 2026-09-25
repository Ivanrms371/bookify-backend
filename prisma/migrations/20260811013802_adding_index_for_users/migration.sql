/*
  Warnings:

  - A unique constraint covering the columns `[phone_country_code,phoneNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_phone_idx";

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_country_code_phone_key" ON "users"("phone_country_code", "phoneNumber");
