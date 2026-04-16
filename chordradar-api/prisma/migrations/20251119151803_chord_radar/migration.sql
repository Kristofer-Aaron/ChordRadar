/*
  Warnings:

  - You are about to drop the column `name` on the `chords` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email_address]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `notation_id` to the `chords` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `user_tokens` DROP FOREIGN KEY `user_tokens_user_id_fkey`;

-- DropIndex
DROP INDEX `user_tokens_user_id_fkey` ON `user_tokens`;

-- AlterTable
ALTER TABLE `chords` DROP COLUMN `name`,
    ADD COLUMN `notation_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `account_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `notations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(16) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_email_address_key` ON `users`(`email_address`);

-- AddForeignKey
ALTER TABLE `chords` ADD CONSTRAINT `chords_notation_id_fkey` FOREIGN KEY (`notation_id`) REFERENCES `notations`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_tokens` ADD CONSTRAINT `user_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
