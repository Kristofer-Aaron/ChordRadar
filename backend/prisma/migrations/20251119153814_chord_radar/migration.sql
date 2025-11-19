-- CreateTable
CREATE TABLE `user_chord_relations` (
    `user_id` INTEGER NOT NULL,
    `chord_id` INTEGER NOT NULL,

    PRIMARY KEY (`user_id`, `chord_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_chord_relations` ADD CONSTRAINT `user_chord_relations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_chord_relations` ADD CONSTRAINT `user_chord_relations_chord_id_fkey` FOREIGN KEY (`chord_id`) REFERENCES `chords`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
