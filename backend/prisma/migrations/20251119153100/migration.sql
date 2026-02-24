/*
  Warnings:

  - A unique constraint covering the columns `[value]` on the table `notations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `notations_value_key` ON `notations`(`value`);
