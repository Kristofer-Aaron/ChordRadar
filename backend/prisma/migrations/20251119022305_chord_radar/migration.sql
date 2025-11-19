-- CreateTable
CREATE TABLE `chords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(16) NOT NULL,
    `tuning_id` INTEGER NOT NULL,
    `grip_id` INTEGER NOT NULL,

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

-- AddForeignKey
ALTER TABLE `chords` ADD CONSTRAINT `chords_tuning_id_fkey` FOREIGN KEY (`tuning_id`) REFERENCES `tunings`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `chords` ADD CONSTRAINT `chords_grip_id_fkey` FOREIGN KEY (`grip_id`) REFERENCES `grips`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
