-- CreateTable
CREATE TABLE `chord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `tuning_id` INTEGER NOT NULL,
    `grip_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tuning` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `value` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grip` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `strings` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chord` ADD CONSTRAINT `chord_tuning_id_fkey` FOREIGN KEY (`tuning_id`) REFERENCES `tuning`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `chord` ADD CONSTRAINT `chord_grip_id_fkey` FOREIGN KEY (`grip_id`) REFERENCES `grip`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
