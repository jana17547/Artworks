/*
  Warnings:

  - You are about to drop the column `category` on the `artwork` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `artwork` DROP COLUMN `category`,
    ADD COLUMN `categoryId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Artwork_categoryId_idx` ON `Artwork`(`categoryId`);

-- CreateIndex
CREATE INDEX `Artwork_price_idx` ON `Artwork`(`price`);

-- AddForeignKey
ALTER TABLE `Artwork` ADD CONSTRAINT `Artwork_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `Artwork_artistId_idx` ON `Artwork`(`artistId`);
-- DROP INDEX `Artwork_artistId_fkey` ON `artwork`;
