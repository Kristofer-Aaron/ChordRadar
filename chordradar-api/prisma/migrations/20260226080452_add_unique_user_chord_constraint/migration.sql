/*
  Warnings:

  - A unique constraint covering the columns `[user_id,chord_id]` on the table `user_chord_relations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `user_chord_relations_user_id_chord_id_key` ON `user_chord_relations`(`user_id`, `chord_id`);
