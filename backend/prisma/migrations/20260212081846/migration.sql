-- DropForeignKey
ALTER TABLE `chords` DROP FOREIGN KEY `chords_grip_id_fkey`;

-- DropForeignKey
ALTER TABLE `chords` DROP FOREIGN KEY `chords_notation_id_fkey`;

-- DropForeignKey
ALTER TABLE `chords` DROP FOREIGN KEY `chords_tuning_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_chord_relations` DROP FOREIGN KEY `user_chord_relations_chord_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_chord_relations` DROP FOREIGN KEY `user_chord_relations_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_tokens` DROP FOREIGN KEY `user_tokens_user_id_fkey`;

-- DropIndex
DROP INDEX `chords_grip_id_fkey` ON `chords`;

-- DropIndex
DROP INDEX `chords_notation_id_fkey` ON `chords`;

-- DropIndex
DROP INDEX `chords_tuning_id_fkey` ON `chords`;

-- DropIndex
DROP INDEX `user_chord_relations_chord_id_fkey` ON `user_chord_relations`;

-- DropIndex
DROP INDEX `user_tokens_user_id_fkey` ON `user_tokens`;

-- AddForeignKey
ALTER TABLE `chords` ADD CONSTRAINT `chords_notation_id_fkey` FOREIGN KEY (`notation_id`) REFERENCES `notations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chords` ADD CONSTRAINT `chords_tuning_id_fkey` FOREIGN KEY (`tuning_id`) REFERENCES `tunings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chords` ADD CONSTRAINT `chords_grip_id_fkey` FOREIGN KEY (`grip_id`) REFERENCES `grips`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_tokens` ADD CONSTRAINT `user_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_chord_relations` ADD CONSTRAINT `user_chord_relations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_chord_relations` ADD CONSTRAINT `user_chord_relations_chord_id_fkey` FOREIGN KEY (`chord_id`) REFERENCES `chords`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
