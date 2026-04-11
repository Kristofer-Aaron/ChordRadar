-- CreateTable
CREATE TABLE `chords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notation_id` INTEGER NOT NULL,
    `tuning_id` INTEGER NOT NULL,
    `grip_id` INTEGER NOT NULL,

    UNIQUE INDEX `chords_notation_tuning_grip_uk`(`notation_id`, `tuning_id`, `grip_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(16) NOT NULL,

    UNIQUE INDEX `notations_value_key`(`value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tunings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(8) NOT NULL,

    UNIQUE INDEX `tunings_value_key`(`value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grips` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `strings` VARCHAR(8) NOT NULL,

    UNIQUE INDEX `grips_strings_key`(`strings`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_name` VARCHAR(16) NOT NULL,
    `first_name` VARCHAR(16) NOT NULL,
    `last_name` VARCHAR(32) NOT NULL,
    `email_address` VARCHAR(255) NOT NULL,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `password_hash` VARCHAR(255) NOT NULL,
    `password_changed_at` DATETIME(3) NOT NULL,
    `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
    `two_factor_method` ENUM('email', 'totp') NULL,
    `two_factor_secret` VARCHAR(255) NULL,
    `two_factor_backup` JSON NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `status` ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
    `account_created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_login_at` DATETIME(3) NOT NULL,
    `preferences` JSON NOT NULL,

    UNIQUE INDEX `users_email_address_key`(`email_address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `type` ENUM('email_verification', 'password_reset', 'api_access') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_chord_relations` (
    `user_id` INTEGER NOT NULL,
    `chord_id` INTEGER NOT NULL,

    UNIQUE INDEX `user_chord_relations_user_id_chord_id_key`(`user_id`, `chord_id`),
    PRIMARY KEY (`user_id`, `chord_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
