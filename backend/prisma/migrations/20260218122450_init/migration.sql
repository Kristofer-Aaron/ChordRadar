/*
  Warnings:

  - The values [google_authenticator,microsoft_authenticator] on the enum `users_two_factor_method` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `two_factor_method` ENUM('email', 'totp') NULL;
