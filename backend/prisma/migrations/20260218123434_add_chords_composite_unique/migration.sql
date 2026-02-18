/*
  Warnings:

  - A unique constraint covering the columns `[notation_id,tuning_id,grip_id]` on the table `chords` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `chords_notation_tuning_grip_uk` ON `chords`(`notation_id`, `tuning_id`, `grip_id`);
